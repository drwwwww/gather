-- Security + privacy hardening ahead of App Store submission.
--
-- 1. Privilege escalation: profiles_update let any user set their own role to
--    ADMIN (or point church_id at any church), and let an admin of one church
--    edit profiles/churches in another. Policies are now church-scoped and a
--    trigger pins role/disabled on self-updates.
-- 2. Private contact data: profiles is readable by every peer in the church
--    (directory), so phone + expo_push_token (which anyone can use to push to
--    that device) move to profile_private, readable only by the owner and
--    their church's admins.
-- 3. UGC safety (App Store guideline 1.2): content_reports + user_blocks.
-- 4. Account deletion (guideline 5.1.1(v)): prepare_account_deletion hands
--    off a user's serving slots before the auth user is deleted.

-- ─── 1. Church-scoped write policies ─────────────────────────────────────────

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
for update
using (
  id = auth.uid()
  or (public.is_admin() and church_id = public.current_user_church_id())
)
with check (
  id = auth.uid()
  or (public.is_admin() and church_id = public.current_user_church_id())
);

drop policy if exists "church_update" on public.churches;
create policy "church_update" on public.churches
for update
using (public.is_admin() and id = public.current_user_church_id())
with check (public.is_admin() and id = public.current_user_church_id());

-- Direct client writes run as `authenticated`; SECURITY DEFINER RPCs
-- (bootstrap_church etc.) and the service role run as their owner and are
-- trusted to set role themselves.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'MEMBER';
    new.disabled := false;
    return new;
  end if;

  if old.id = auth.uid() then
    -- Joining or leaving a church always lands you as a plain member there.
    if new.church_id is distinct from old.church_id then
      new.role := 'MEMBER';
    -- Only an admin may change their own role (i.e. step down).
    elsif old.role <> 'ADMIN' then
      new.role := old.role;
    end if;
    new.disabled := old.disabled;
  else
    -- Admin editing someone else: never move them to another church.
    new.church_id := old.church_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileges on public.profiles;
create trigger trg_guard_profile_privileges
before insert or update on public.profiles
for each row execute function public.guard_profile_privileges();

-- Announcement/event images are stored under `<church_id>/…`.
drop policy if exists "Admins can upload announcement images" on storage.objects;
drop policy if exists "Admins can upload event images" on storage.objects;
drop policy if exists "Admins can delete announcement images" on storage.objects;
create policy "Admins can upload announcement images" on storage.objects
for insert
with check (
  bucket_id = 'announcements'
  and public.is_admin()
  and (storage.foldername(name))[1] = public.current_user_church_id()::text
);
create policy "Admins can delete announcement images" on storage.objects
for delete
using (
  bucket_id = 'announcements'
  and public.is_admin()
  and (storage.foldername(name))[1] = public.current_user_church_id()::text
);

-- ─── 2. Private contact data ─────────────────────────────────────────────────

create table if not exists public.profile_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  expo_push_token text,
  updated_at timestamptz not null default now()
);

alter table public.profile_private enable row level security;

create policy "profile_private_self_select" on public.profile_private
for select using (user_id = auth.uid());
create policy "profile_private_self_insert" on public.profile_private
for insert with check (user_id = auth.uid());
create policy "profile_private_self_update" on public.profile_private
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profile_private_self_delete" on public.profile_private
for delete using (user_id = auth.uid());
-- Admins can see a member's phone (to reach them); push tokens are only ever
-- read server-side with the service role.
create policy "profile_private_admin_select" on public.profile_private
for select using (
  public.is_admin()
  and exists (
    select 1 from public.profiles p
    where p.id = profile_private.user_id
      and p.church_id = public.current_user_church_id()
  )
);

insert into public.profile_private (user_id, phone, expo_push_token)
select id, phone, expo_push_token
from public.profiles
where phone is not null or expo_push_token is not null
on conflict (user_id) do update
  set phone = excluded.phone,
      expo_push_token = excluded.expo_push_token;

drop index if exists public.idx_profiles_phone;
alter table public.profiles drop column if exists phone;
alter table public.profiles drop column if exists expo_push_token;

-- ─── 3. Reports + blocks ─────────────────────────────────────────────────────

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reason text not null check (reason in ('INAPPROPRIATE', 'HARASSMENT', 'SPAM', 'IMPERSONATION', 'OTHER')),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_content_reports_church_open
  on public.content_reports(church_id) where resolved_at is null;

alter table public.content_reports enable row level security;

create policy "content_reports_insert_self" on public.content_reports
for insert with check (
  reporter_id = auth.uid()
  and church_id = public.current_user_church_id()
  and reported_user_id <> auth.uid()
);
create policy "content_reports_admin_select" on public.content_reports
for select using (public.is_admin() and church_id = public.current_user_church_id());
create policy "content_reports_admin_update" on public.content_reports
for update
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

create policy "user_blocks_self_all" on public.user_blocks
for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ─── 4. Account deletion hand-off ────────────────────────────────────────────

-- Called by /api/account/delete (service role) right before
-- auth.admin.deleteUser. FKs already cascade / set null, but a slot whose
-- assignee vanishes would otherwise keep a stale CONFIRMED status, so this
-- promotes the backup (or reopens the slot) first.
create or replace function public.prepare_account_deletion(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_church uuid;
  v_role public.role_enum;
  v_other_admins int;
  v_other_members int;
begin
  select church_id, role into v_church, v_role from public.profiles where id = p_user_id;

  if v_church is not null and v_role = 'ADMIN' then
    select count(*) filter (where role = 'ADMIN' and not coalesce(disabled, false)),
           count(*)
      into v_other_admins, v_other_members
      from public.profiles
     where church_id = v_church and id <> p_user_id;

    if v_other_admins = 0 and v_other_members > 0 then
      raise exception 'LAST_ADMIN' using hint = 'Make another member an admin before deleting your account.';
    end if;

    -- Sole person in the church: the church's data goes with them.
    if v_other_members = 0 then
      delete from public.churches where id = v_church;
      return 'deleted_church';
    end if;
  end if;

  update public.service_plan_role_slots
     set assigned_user_id = backup_user_id,
         backup_user_id = null,
         status = case when backup_user_id is null then 'OPEN' else 'ASSIGNED' end::public.assignment_status_enum
   where assigned_user_id = p_user_id;
  update public.service_plan_role_slots set backup_user_id = null where backup_user_id = p_user_id;

  update public.service_plan_items
     set assigned_user_id = backup_user_id,
         backup_user_id = null,
         assignment_status = case when backup_user_id is null then 'OPEN' else 'ASSIGNED' end::public.assignment_status_enum
   where assigned_user_id = p_user_id;
  update public.service_plan_items set backup_user_id = null where backup_user_id = p_user_id;

  return 'ok';
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
