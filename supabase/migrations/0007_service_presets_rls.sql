-- RLS for service presets and plans
alter table public.service_presets enable row level security;
alter table public.service_preset_items enable row level security;
alter table public.service_plans enable row level security;
alter table public.service_plan_items enable row level security;

-- Presets policies (admin only)
create policy "service_presets_admin_all" on public.service_presets
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create policy "service_preset_items_admin_all" on public.service_preset_items
for all
using (
  public.is_admin()
  and exists (
    select 1 from public.service_presets p
    where p.id = preset_id and p.church_id = public.current_user_church_id()
  )
)
with check (
  public.is_admin()
  and exists (
    select 1 from public.service_presets p
    where p.id = preset_id and p.church_id = public.current_user_church_id()
  )
);

-- Plans policies
create policy "service_plans_admin_all" on public.service_plans
for all
using (public.is_admin() and church_id = public.current_user_church_id())
with check (public.is_admin() and church_id = public.current_user_church_id());

create policy "service_plans_service_select" on public.service_plans
for select
using (public.is_service() and church_id = public.current_user_church_id());

create policy "service_plans_member_select" on public.service_plans
for select
using (public.is_member() and church_id = public.current_user_church_id());

create policy "service_plan_items_admin_all" on public.service_plan_items
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

create policy "service_plan_items_service_select" on public.service_plan_items
for select
using (
  public.is_service()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);

create policy "service_plan_items_member_select" on public.service_plan_items
for select
using (
  public.is_member()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);

-- RPC: generate plan from preset
create or replace function public.create_service_plan_from_preset(
  p_service_time_id uuid,
  p_service_date date,
  p_preset_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_church_id uuid;
  v_plan_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create service plans';
  end if;

  v_church_id := public.current_user_church_id();
  if v_church_id is null then
    raise exception 'Missing church context';
  end if;

  if not exists (
    select 1 from public.service_presets
    where id = p_preset_id
      and church_id = v_church_id
      and service_time_id = p_service_time_id
  ) then
    raise exception 'Preset not found for this service time';
  end if;

  if exists (
    select 1 from public.service_plans
    where church_id = v_church_id
      and service_time_id = p_service_time_id
      and service_date = p_service_date
  ) then
    raise exception 'Service plan already exists';
  end if;

  insert into public.service_plans (church_id, service_time_id, service_date, preset_id, title)
  values (v_church_id, p_service_time_id, p_service_date, p_preset_id, '')
  returning id into v_plan_id;

  insert into public.service_plan_items (plan_id, position, title, duration_minutes, notes, owner_role_id)
  select v_plan_id, position, title, duration_minutes, notes, owner_role_id
  from public.service_preset_items
  where preset_id = p_preset_id
  order by position;

  return v_plan_id;
end;
$$;

grant execute on function public.create_service_plan_from_preset(uuid, date, uuid) to authenticated;
