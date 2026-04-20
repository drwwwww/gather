-- Run-of-show steps: assign a specific person (e.g. Closing Prayer).
alter table public.service_plan_items
  add column if not exists assigned_user_id uuid references auth.users(id) on delete set null;

create index if not exists service_plan_items_assigned_user_idx
  on public.service_plan_items(assigned_user_id)
  where assigned_user_id is not null;

-- Plan-level role slots (ushers, greeters, etc.) — not ordered steps in the run of show.
create table if not exists public.service_plan_role_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.service_plans(id) on delete cascade,
  role_id uuid not null references public.volunteer_roles(id) on delete cascade,
  sort_order int not null default 0,
  assigned_user_id uuid references auth.users(id) on delete set null,
  backup_user_id uuid references auth.users(id) on delete set null,
  status public.assignment_status_enum not null default 'OPEN',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists service_plan_role_slots_plan_idx
  on public.service_plan_role_slots(plan_id, sort_order);

alter table public.service_plan_role_slots enable row level security;

create policy "service_plan_role_slots_admin_all" on public.service_plan_role_slots
for all
using (
  public.is_admin()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
)
with check (
  public.is_admin()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);

create policy "service_plan_role_slots_service_select" on public.service_plan_role_slots
for select
using (
  public.is_service()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);

create policy "service_plan_role_slots_member_select" on public.service_plan_role_slots
for select
using (
  public.is_member()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);
