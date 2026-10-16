-- Tighten the service-day flow from 0039:
--   • Running the service (marking parts done/skipped) is admin-only — the
--     service team are volunteers, not the people driving the run-of-show.
--   • Check-in only works on the day of the service, in the church's own
--     timezone (a Sunday 9am plan can't be "checked in" on Thursday).

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
  if not public.is_admin() then raise exception 'Forbidden'; end if;

  update public.service_plan_items i
     set status = p_status
    from public.service_plans p
   where i.id = p_item_id
     and p.id = i.plan_id
     and p.church_id = public.current_user_church_id();

  if not found then raise exception 'Item not found'; end if;
end;
$$;

create or replace function public.check_in_to_plan(p_plan_id uuid)
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_service_date date;
  v_tz text;
  v_count int := 0;
  v_n int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select p.service_date, coalesce(c.timezone, 'America/New_York')
    into v_service_date, v_tz
    from public.service_plans p
    join public.churches c on c.id = p.church_id
   where p.id = p_plan_id
     and p.church_id = public.current_user_church_id();

  if not found then raise exception 'Plan not found'; end if;

  if v_service_date <> (now() at time zone v_tz)::date then
    raise exception 'NOT_SERVICE_DAY' using hint = 'Check-in opens on the day of the service.';
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
