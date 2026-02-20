-- Service presets and plans
create table if not exists public.service_presets (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_time_id uuid not null references public.service_times(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.service_preset_items (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.service_presets(id) on delete cascade,
  position int not null,
  title text not null,
  duration_minutes int null,
  notes text not null default '',
  owner_role_id uuid null references public.volunteer_roles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_plans (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_time_id uuid not null references public.service_times(id) on delete cascade,
  service_date date not null,
  preset_id uuid null references public.service_presets(id) on delete set null,
  title text not null default '',
  created_at timestamptz not null default now(),
  unique (church_id, service_time_id, service_date)
);

create table if not exists public.service_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.service_plans(id) on delete cascade,
  position int not null,
  title text not null,
  duration_minutes int null,
  notes text not null default '',
  owner_role_id uuid null references public.volunteer_roles(id) on delete set null,
  status text not null default 'PLANNED',
  created_at timestamptz not null default now(),
  constraint service_plan_items_status_check check (status in ('PLANNED', 'DONE', 'SKIPPED'))
);

create index if not exists service_preset_items_position_idx
  on public.service_preset_items (preset_id, position);

create index if not exists service_plan_items_position_idx
  on public.service_plan_items (plan_id, position);

create index if not exists service_plans_church_date_idx
  on public.service_plans (church_id, service_date);
