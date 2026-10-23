-- Announcements with substance: a type, and what you can do with each one.
--
--   UPDATE   plain news (what announcements were before)
--   EVENT    linked to an events row: date/place/RSVP come from the event
--   SIGNUP   slots people take (meal train, bring a dish, help set up)
--   PRAYER   a request people can say they're praying for
--
-- Any type can be pinned or marked important, name a contact person, and carry
-- a short "Know before you go" list (info: [{"label": "...", "text": "..."}]).
-- Child tables follow the announcement's own visibility: a row is visible when
-- the announcement is (the exists() subquery runs under the caller's RLS).

alter table public.announcements
  add column if not exists kind text not null default 'UPDATE',
  add column if not exists pinned boolean not null default false,
  add column if not exists important boolean not null default false,
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists contact_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists closes_at timestamptz,
  add column if not exists info jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.announcements add constraint announcements_kind_check check (kind in ('UPDATE', 'EVENT', 'SIGNUP', 'PRAYER'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.announcements add constraint announcements_info_is_array check (jsonb_typeof(info) = 'array' and jsonb_array_length(info) <= 8);
exception when duplicate_object then null; end $$;

create index if not exists announcements_event_idx on public.announcements(event_id) where event_id is not null;

-- ------------------------------------------------------------------ sign-up slots
create table if not exists public.announcement_slots (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 80),
  detail text check (detail is null or length(detail) <= 160),
  capacity int not null default 1 check (capacity between 1 and 500),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists announcement_slots_announcement_idx on public.announcement_slots(announcement_id, position);

create table if not exists public.announcement_signups (
  slot_id uuid not null references public.announcement_slots(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (slot_id, user_id)
);
create index if not exists announcement_signups_announcement_idx on public.announcement_signups(announcement_id);

-- Shared only with people who signed up (and admins): an address, a door code.
create table if not exists public.announcement_private (
  announcement_id uuid primary key references public.announcements(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  note text not null default '' check (length(note) <= 1000)
);

-- ------------------------------------------------------------------ prayer
create table if not exists public.announcement_reactions (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'PRAYING' check (kind in ('PRAYING')),
  created_at timestamptz not null default now(),
  primary key (announcement_id, user_id, kind)
);

alter table public.announcement_slots enable row level security;
alter table public.announcement_signups enable row level security;
alter table public.announcement_private enable row level security;
alter table public.announcement_reactions enable row level security;

drop policy if exists "slots_select" on public.announcement_slots;
create policy "slots_select" on public.announcement_slots for select
using (exists (select 1 from public.announcements a where a.id = announcement_id));
drop policy if exists "slots_admin_write" on public.announcement_slots;
create policy "slots_admin_write" on public.announcement_slots for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id()
  and exists (select 1 from public.announcements a where a.id = announcement_slots.announcement_id and a.church_id = announcement_slots.church_id));

-- Who took which slot is visible to everyone who can see the post (SignUpGenius
-- style); taking and leaving go through the RPCs below, admins can clear any.
drop policy if exists "signups_select" on public.announcement_signups;
create policy "signups_select" on public.announcement_signups for select
using (exists (select 1 from public.announcements a where a.id = announcement_id));
drop policy if exists "signups_admin_delete" on public.announcement_signups;
create policy "signups_admin_delete" on public.announcement_signups for delete
using (public.is_admin() and church_id = public.current_user_church_id());

drop policy if exists "private_select" on public.announcement_private;
create policy "private_select" on public.announcement_private for select
using (
  church_id = public.current_user_church_id()
  and (public.is_admin() or exists (
    select 1 from public.announcement_signups s where s.announcement_id = announcement_private.announcement_id and s.user_id = auth.uid()
  ))
);
drop policy if exists "private_admin_write" on public.announcement_private;
create policy "private_admin_write" on public.announcement_private for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

drop policy if exists "reactions_select" on public.announcement_reactions;
create policy "reactions_select" on public.announcement_reactions for select
using (exists (select 1 from public.announcements a where a.id = announcement_id));
drop policy if exists "reactions_insert_own" on public.announcement_reactions;
create policy "reactions_insert_own" on public.announcement_reactions for insert
with check (
  user_id = auth.uid()
  and church_id = public.current_user_church_id()
  and exists (select 1 from public.announcements a where a.id = announcement_reactions.announcement_id and a.church_id = announcement_reactions.church_id and a.kind = 'PRAYER')
);
drop policy if exists "reactions_delete_own" on public.announcement_reactions;
create policy "reactions_delete_own" on public.announcement_reactions for delete
using (user_id = auth.uid());

-- ------------------------------------------------------------------ take / leave a slot
-- One slot per person per post: taking a new one moves you. Refuses a full slot,
-- a closed or unpublished post, or one your audience can't see.
create or replace function public.take_announcement_slot(p_slot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_slot record;
  v_role public.role_enum;
  v_taken int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select s.*, a.audience, a.publish_at, a.closes_at, a.kind
    into v_slot
    from public.announcement_slots s
    join public.announcements a on a.id = s.announcement_id
   where s.id = p_slot_id
     and s.church_id = public.current_user_church_id()
   for update of s;
  if not found then return jsonb_build_object('error', 'not found'); end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_slot.kind <> 'SIGNUP'
     or v_slot.publish_at is null or v_slot.publish_at > now()
     or not public.audience_reaches(v_slot.audience, v_role) then
    return jsonb_build_object('error', 'not found');
  end if;
  if v_slot.closes_at is not null and v_slot.closes_at <= now() then
    return jsonb_build_object('error', 'closed');
  end if;

  if exists (select 1 from public.announcement_signups where slot_id = p_slot_id and user_id = v_uid) then
    return jsonb_build_object('ok', true);
  end if;

  select count(*) into v_taken from public.announcement_signups where slot_id = p_slot_id;
  if v_taken >= v_slot.capacity then return jsonb_build_object('error', 'full'); end if;

  delete from public.announcement_signups where announcement_id = v_slot.announcement_id and user_id = v_uid;
  insert into public.announcement_signups (slot_id, announcement_id, church_id, user_id)
  values (p_slot_id, v_slot.announcement_id, v_slot.church_id, v_uid);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.leave_announcement_slot(p_slot_id uuid)
returns void
language sql
security definer
set search_path = public
set row_security = off
as $$
  delete from public.announcement_signups where slot_id = p_slot_id and user_id = auth.uid();
$$;

revoke all on function public.take_announcement_slot(uuid) from public, anon;
revoke all on function public.leave_announcement_slot(uuid) from public, anon;
grant execute on function public.take_announcement_slot(uuid) to authenticated;
grant execute on function public.leave_announcement_slot(uuid) to authenticated;
