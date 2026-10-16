-- Service-day flow (replaces the mobile "Check in will be available…" stub).
--   • Volunteers check themselves in when they arrive  → checked_in_at
--   • Service/admin team marks run-of-show parts done   → service_plan_items.status
-- Both go through SECURITY DEFINER RPCs so the rules live in one place rather
-- than widening the update policies on either table.

alter table public.service_plan_role_slots add column if not exists checked_in_at timestamptz;
alter table public.service_plan_items add column if not exists checked_in_at timestamptz;

-- Check the caller in to every slot/part they hold in a plan (primary or a
-- backup who has stepped in). Returns how many rows were checked in.
create or replace function public.check_in_to_plan(p_plan_id uuid)
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_count int := 0;
  v_n int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  if not exists (
    select 1 from public.service_plans p
    where p.id = p_plan_id and p.church_id = public.current_user_church_id()
  ) then
    raise exception 'Plan not found';
  end if;

  update public.service_plan_role_slots
     set checked_in_at = coalesce(checked_in_at, now())
   where plan_id = p_plan_id
     and assigned_user_id = v_uid
     and status <> 'DECLINED';
  get diagnostics v_n = row_count; v_count := v_count + v_n;

  update public.service_plan_items
     set checked_in_at = coalesce(checked_in_at, now())
   where plan_id = p_plan_id
     and assigned_user_id = v_uid
     and assignment_status <> 'DECLINED';
  get diagnostics v_n = row_count; v_count := v_count + v_n;

  return v_count;
end;
$$;

-- Live run-of-show: service team or admins move a part between
-- PLANNED / DONE / SKIPPED during the service.
create or replace function public.set_plan_item_status(p_item_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('PLANNED', 'DONE', 'SKIPPED') then raise exception 'Invalid status'; end if;
  if not (public.is_admin() or public.is_service()) then raise exception 'Forbidden'; end if;

  update public.service_plan_items i
     set status = p_status
    from public.service_plans p
   where i.id = p_item_id
     and p.id = i.plan_id
     and p.church_id = public.current_user_church_id();

  if not found then raise exception 'Item not found'; end if;
end;
$$;

grant execute on function public.check_in_to_plan(uuid) to authenticated;
grant execute on function public.set_plan_item_status(uuid, text) to authenticated;
