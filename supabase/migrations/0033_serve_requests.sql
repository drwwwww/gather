-- Regular members need a way to request to serve. Product decision: auto-approve
-- (the requester's role flips MEMBER -> SERVICE immediately, no admin gate to
-- get started) but church admins are notified via the existing notification_log
-- pipeline so they know who just joined the team and can follow up.

create table if not exists public.serve_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_ids uuid[] not null default '{}',
  role_names text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_serve_requests_church on public.serve_requests(church_id);
create index if not exists idx_serve_requests_user on public.serve_requests(user_id);

alter table public.serve_requests enable row level security;

-- Members can see their own request history; admins can see every request for
-- their church. All writes happen through request_to_serve() below (SECURITY
-- DEFINER, row_security off), so no insert/update/delete policy is needed for
-- direct client access — that's intentional, not an oversight.
create policy "serve_requests_self_select" on public.serve_requests
for select
using (user_id = auth.uid());

create policy "serve_requests_admin_select" on public.serve_requests
for select
using (public.is_admin() and church_id = public.current_user_church_id());

create or replace function public.request_to_serve(p_role_ids uuid[] default '{}', p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_church uuid;
  v_role public.role_enum;
  v_requester_name text;
  v_role_names text[];
  v_clean_note text;
  v_request_id uuid;
  v_admin record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select church_id, role, coalesce(nullif(trim(full_name), ''), email, 'A member')
    into v_church, v_role, v_requester_name
  from public.profiles
  where id = auth.uid();

  if v_church is null then
    raise exception 'You must belong to a church to request to serve';
  end if;

  if v_role = 'ADMIN'::public.role_enum then
    raise exception 'Admins are already part of the service team';
  end if;

  -- Resolve role ids to names scoped to the caller's own church, so a bogus or
  -- cross-church id in p_role_ids can never surface another church's role names.
  select coalesce(array_agg(name order by name), '{}')
    into v_role_names
  from public.volunteer_roles
  where church_id = v_church
    and id = any(coalesce(p_role_ids, '{}'));

  v_clean_note := nullif(trim(coalesce(p_note, '')), '');

  insert into public.serve_requests (church_id, user_id, role_ids, role_names, note)
  values (v_church, auth.uid(), coalesce(p_role_ids, '{}'), v_role_names, v_clean_note)
  returning id into v_request_id;

  if v_role = 'MEMBER'::public.role_enum then
    update public.profiles set role = 'SERVICE'::public.role_enum where id = auth.uid();
  end if;

  for v_admin in
    select id from public.profiles
    where church_id = v_church
      and role = 'ADMIN'::public.role_enum
      and coalesce(disabled, false) = false
  loop
    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    values (
      v_church,
      v_admin.id,
      'SERVE_REQUEST',
      jsonb_build_object(
        'request_id', v_request_id,
        'requester_id', auth.uid(),
        'requester_name', v_requester_name,
        'role_names', v_role_names,
        'note', v_clean_note
      ),
      now()
    );
  end loop;

  return v_request_id;
end;
$$;

grant execute on function public.request_to_serve(uuid[], text) to authenticated;

comment on function public.request_to_serve(uuid[], text) is
  'Member self-service: logs a serve request, auto-promotes MEMBER to SERVICE, and notifies church admins. Deliberately not exposed as a raw profiles.role UPDATE from the client.';
