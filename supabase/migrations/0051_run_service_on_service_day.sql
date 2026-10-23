-- Running the service (marking steps done/skipped) only on the service day.
--
-- The web only offers Done/Skip on Live Service for today's plans, but the RPC
-- accepted any date, and the mobile bulletin's "Run service" was available days
-- early. Same rule as check_in_to_plan: the plan's date must be today in the
-- church's timezone. Putting a step back to PLANNED stays allowed any time, so a
-- mistaken tap can always be undone.

create or replace function public.set_plan_item_status(p_item_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_service_date date;
  v_tz text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('PLANNED', 'DONE', 'SKIPPED') then raise exception 'Invalid status'; end if;
  if not public.is_admin() then raise exception 'Forbidden'; end if;

  select p.service_date, coalesce(c.timezone, 'America/New_York')
    into v_service_date, v_tz
    from public.service_plan_items i
    join public.service_plans p on p.id = i.plan_id
    join public.churches c on c.id = p.church_id
   where i.id = p_item_id
     and p.church_id = public.current_user_church_id();

  if not found then raise exception 'Item not found'; end if;

  if p_status <> 'PLANNED' and v_service_date <> (now() at time zone v_tz)::date then
    raise exception 'NOT_SERVICE_DAY' using hint = 'The service can be run on the day of the service.';
  end if;

  update public.service_plan_items
     set status = p_status
   where id = p_item_id;
end;
$$;
