-- Extensions
create extension if not exists "pgcrypto";

-- Dev reset (drop existing schema objects to avoid type mismatches)
drop table if exists public.event_rsvps cascade;
drop table if exists public.volunteer_assignments cascade;
drop table if exists public.volunteer_roles cascade;
drop table if exists public.service_times cascade;
drop table if exists public.ministries cascade;
drop table if exists public.announcements cascade;
drop table if exists public.events cascade;
drop table if exists public.notification_log cascade;
drop table if exists public.profiles cascade;
drop table if exists public.churches cascade;

drop type if exists rsvp_status_enum cascade;
drop type if exists assignment_status_enum cascade;
drop type if exists audience_enum cascade;
drop type if exists role_enum cascade;

-- Enums
create type role_enum as enum ('ADMIN', 'SERVICE', 'MEMBER');
create type audience_enum as enum ('ALL', 'MEMBER', 'SERVICE', 'ADMIN', 'MINISTRY');
create type assignment_status_enum as enum ('OPEN', 'ASSIGNED', 'CONFIRMED', 'DECLINED');
create type rsvp_status_enum as enum ('GOING', 'MAYBE', 'NO');

-- Tables
create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  full_name text,
  email text,
  role role_enum not null default 'MEMBER',
  created_at timestamptz not null default now()
);

create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null
);

create table if not exists public.service_times (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  day_of_week int2 not null check (day_of_week between 0 and 6),
  start_time time not null,
  timezone text not null
);

create table if not exists public.volunteer_roles (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  ministry_id uuid references public.ministries(id) on delete set null,
  name text not null,
  description text
);

create table if not exists public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_time_id uuid not null references public.service_times(id) on delete cascade,
  role_id uuid not null references public.volunteer_roles(id) on delete cascade,
  assigned_user_id uuid references auth.users(id) on delete set null,
  status assignment_status_enum not null default 'OPEN',
  notes text,
  scheduled_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  body text not null,
  audience audience_enum not null default 'ALL',
  ministry_id uuid references public.ministries(id) on delete set null,
  publish_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  audience audience_enum not null default 'ALL',
  ministry_id uuid references public.ministries(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status rsvp_status_enum not null default 'GOING',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz
);

create index if not exists idx_profiles_church on public.profiles(church_id);
create index if not exists idx_ministries_church on public.ministries(church_id);
create index if not exists idx_service_times_church on public.service_times(church_id);
create index if not exists idx_roles_church on public.volunteer_roles(church_id);
create index if not exists idx_assignments_church on public.volunteer_assignments(church_id);
create index if not exists idx_assignments_date on public.volunteer_assignments(scheduled_date);
create index if not exists idx_announcements_church on public.announcements(church_id);
create index if not exists idx_events_church on public.events(church_id);
create index if not exists idx_events_start on public.events(start_at);

-- Helper functions
create or replace function public.current_user_role()
returns role_enum
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_church_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select church_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'ADMIN'::role_enum;
$$;

create or replace function public.is_service()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'SERVICE'::role_enum;
$$;

create or replace function public.is_member()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'MEMBER'::role_enum;
$$;

-- Bootstrap admin flow
drop function if exists public.bootstrap_church(text, text);
create or replace function public.bootstrap_church(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_church_id uuid;
  v_email text;
  v_full_name text;
begin
  select email, raw_user_meta_data->>'full_name' into v_email, v_full_name from auth.users where id = auth.uid();

  insert into public.churches (name, slug)
  values (p_name, p_slug)
  returning id into v_church_id;

  insert into public.profiles (id, church_id, full_name, email, role)
  values (auth.uid(), v_church_id, v_full_name, v_email, 'ADMIN')
  on conflict (id) do update
    set church_id = excluded.church_id,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = coalesce(excluded.email, public.profiles.email),
        role = 'ADMIN';

  return v_church_id;
end;
$$;

grant execute on function public.bootstrap_church(text, text) to authenticated;

-- RLS
alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.ministries enable row level security;
alter table public.service_times enable row level security;
alter table public.volunteer_roles enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.notification_log enable row level security;

-- Churches policies
create policy "church_select" on public.churches
for select
using (id = public.current_user_church_id());

create policy "church_insert" on public.churches
for insert
with check (auth.uid() is not null);

create policy "church_update" on public.churches
for update
using (public.is_admin())
with check (public.is_admin());

-- Profiles policies
create policy "profiles_select" on public.profiles
for select
using (id = auth.uid() or (public.is_admin() and church_id = public.current_user_church_id()));

create policy "profiles_insert" on public.profiles
for insert
with check (id = auth.uid());

create policy "profiles_update" on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Ministries policies (admin only)
create policy "ministries_admin_all" on public.ministries
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

-- Service times policies (admin only)
create policy "service_times_admin_all" on public.service_times
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

-- Volunteer roles policies (admin only)
create policy "volunteer_roles_admin_all" on public.volunteer_roles
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

-- Volunteer assignments policies
create policy "assignments_admin_all" on public.volunteer_assignments
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create policy "assignments_service_select" on public.volunteer_assignments
for select
using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or status = 'OPEN')
);

create policy "assignments_service_update" on public.volunteer_assignments
for update
using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and assigned_user_id = auth.uid()
)
with check (
  public.is_service()
  and church_id = public.current_user_church_id()
  and assigned_user_id = auth.uid()
);

-- Announcements policies
create policy "announcements_admin_all" on public.announcements
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create policy "announcements_service_select" on public.announcements
for select
using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and audience in ('ALL', 'SERVICE')
);

create policy "announcements_member_select" on public.announcements
for select
using (
  public.is_member()
  and church_id = public.current_user_church_id()
  and audience in ('ALL', 'MEMBER')
);

-- Events policies
create policy "events_admin_all" on public.events
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create policy "events_service_select" on public.events
for select
using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and audience in ('ALL', 'SERVICE')
);

create policy "events_member_select" on public.events
for select
using (
  public.is_member()
  and church_id = public.current_user_church_id()
  and audience in ('ALL', 'MEMBER')
);

-- RSVP policies
create policy "rsvps_self_select" on public.event_rsvps
for select
using (
  user_id = auth.uid()
  or (public.is_admin() and exists (
    select 1 from public.events e
    where e.id = event_id and e.church_id = public.current_user_church_id()
  ))
);

create policy "rsvps_self_insert" on public.event_rsvps
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.church_id = public.current_user_church_id()
  )
);

create policy "rsvps_self_update" on public.event_rsvps
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Notification log policies
create policy "notifications_admin_all" on public.notification_log
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create policy "notifications_self_select" on public.notification_log
for select
using (user_id = auth.uid());
