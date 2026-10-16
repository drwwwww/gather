-- Scheduling integrity, enforced in the database so every writer (web plan
-- editor, Volunteers page, mobile, seeds) gets the same rules.
--
-- Found in the audit:
--   • A new person put on a CONFIRMED slot/part inherited "Confirmed".
--   • Parts saved with a person but assignment_status 'OPEN'.
--   • DECLINED slots whose backup was never promoted.
--   • "Copy last plan" carried last week's CONFIRMED/DECLINED and DONE.
--   • 157 assignments held by MEMBER-role people, who have no Serve tab and
--     no read access to role names — they could never see or answer them.
--   • A backup tapping Confirm/Decline overwrote the *primary's* answer.

-- ─── Slot / part normalisation ──────────────────────────────────────────────

create or replace function public.normalize_schedule_row()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_status text;
  v_is_client boolean := session_user = 'authenticator' and current_setting('role', true) in ('authenticated', 'anon');
begin
  -- Same column, different name on the two tables.
  -- (read via jsonb: PL/pgSQL can't name a column one of the two tables lacks)
  v_status := to_jsonb(new) ->> (case when tg_table_name = 'service_plan_items' then 'assignment_status' else 'status' end);

  if new.backup_user_id is not null and new.backup_user_id = new.assigned_user_id then
    new.backup_user_id := null;
  end if;

  -- Primary declined and a backup exists → the backup steps up.
  if v_status = 'DECLINED' and new.assigned_user_id is not null and new.backup_user_id is not null
     and (tg_op = 'INSERT' or old.assigned_user_id is not distinct from new.assigned_user_id) then
    new.assigned_user_id := new.backup_user_id;
    new.backup_user_id := null;
    v_status := 'ASSIGNED';
  end if;

  if new.assigned_user_id is null then
    v_status := 'OPEN';
    new.checked_in_at := null;
  elsif tg_op = 'UPDATE' and old.assigned_user_id is distinct from new.assigned_user_id then
    -- A different person hasn't answered yet, whatever the previous one said.
    v_status := 'ASSIGNED';
    new.checked_in_at := null;
  elsif tg_op = 'INSERT' and v_is_client then
    -- A row created from the app (new slot, copied plan) can't already be answered.
    v_status := 'ASSIGNED';
  elsif v_status = 'OPEN' then
    -- Someone is on it, so it isn't open.
    v_status := 'ASSIGNED';
  end if;

  if tg_op = 'INSERT' and v_is_client then
    new.checked_in_at := null;
    if tg_table_name = 'service_plan_items' then
      new.status := 'PLANNED';
    end if;
  end if;

  if tg_table_name = 'service_plan_items' then
    new.assignment_status := v_status::public.assignment_status_enum;
  else
    new.status := v_status::public.assignment_status_enum;
  end if;

  -- Anyone on the schedule is on the service team (Serve tab, role names, reminders).
  update public.profiles
     set role = 'SERVICE'
   where id in (new.assigned_user_id, new.backup_user_id)
     and role = 'MEMBER';

  return new;
end;
$$;

drop trigger if exists trg_normalize_slot on public.service_plan_role_slots;
create trigger trg_normalize_slot
before insert or update on public.service_plan_role_slots
for each row execute function public.normalize_schedule_row();

drop trigger if exists trg_normalize_item on public.service_plan_items;
create trigger trg_normalize_item
before insert or update on public.service_plan_items
for each row execute function public.normalize_schedule_row();

-- ─── Confirm / decline ──────────────────────────────────────────────────────
-- Primary: CONFIRMED/DECLINED as before (decline promotes the backup).
-- Backup: DECLINED steps them down as backup; CONFIRMED is an acknowledgement
-- and leaves the primary's status alone. Past services can't be answered.

create or replace function public.respond_assignment(p_source text, p_id uuid, p_response text)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_assigned uuid;
  v_backup uuid;
  v_plan_id uuid;
  v_date date;
  v_tz text;
  v_church uuid := public.current_user_church_id();
begin
  if p_response not in ('CONFIRMED', 'DECLINED') then
    return jsonb_build_object('error', 'invalid response: must be CONFIRMED or DECLINED');
  end if;
  if v_uid is null or v_church is null then
    return jsonb_build_object('error', 'not found');
  end if;

  if p_source = 'plan_role_slot' then
    select assigned_user_id, backup_user_id, plan_id into v_assigned, v_backup, v_plan_id
      from public.service_plan_role_slots where id = p_id;
  elsif p_source = 'plan_item' then
    select assigned_user_id, backup_user_id, plan_id into v_assigned, v_backup, v_plan_id
      from public.service_plan_items where id = p_id;
  else
    return jsonb_build_object('error', 'unknown source');
  end if;
  if not found then return jsonb_build_object('error', 'not found'); end if;

  select p.service_date, coalesce(c.timezone, 'America/New_York') into v_date, v_tz
    from public.service_plans p join public.churches c on c.id = p.church_id
   where p.id = v_plan_id and p.church_id = v_church;
  if not found then return jsonb_build_object('error', 'not found'); end if;
  if v_date < (now() at time zone v_tz)::date then
    return jsonb_build_object('error', 'this service has already happened');
  end if;

  if v_assigned = v_uid then
    -- The trigger promotes the backup on DECLINED.
    if p_source = 'plan_role_slot' then
      update public.service_plan_role_slots set status = p_response::assignment_status_enum where id = p_id;
    else
      update public.service_plan_items set assignment_status = p_response::assignment_status_enum where id = p_id;
    end if;
    return jsonb_build_object('promoted', p_response = 'DECLINED' and v_backup is not null, 'role', 'primary');
  elsif v_backup = v_uid then
    if p_response = 'DECLINED' then
      if p_source = 'plan_role_slot' then
        update public.service_plan_role_slots set backup_user_id = null where id = p_id;
      else
        update public.service_plan_items set backup_user_id = null where id = p_id;
      end if;
    end if;
    return jsonb_build_object('promoted', false, 'role', 'backup');
  end if;

  return jsonb_build_object('error', 'permission denied');
end;
$$;

grant execute on function public.respond_assignment(text, uuid, text) to authenticated;

-- ─── Repair existing data (runs the triggers above) ────────────────────────

update public.service_plan_items set assignment_status = assignment_status
 where assigned_user_id is not null and assignment_status = 'OPEN';
update public.service_plan_role_slots set status = status
 where status = 'DECLINED' and backup_user_id is not null;
update public.service_plan_items set assignment_status = assignment_status
 where assignment_status = 'DECLINED' and backup_user_id is not null;

update public.profiles p
   set role = 'SERVICE'
 where p.role = 'MEMBER'
   and exists (
     select 1 from public.service_plan_role_slots s where p.id in (s.assigned_user_id, s.backup_user_id)
     union all
     select 1 from public.service_plan_items i where p.id in (i.assigned_user_id, i.backup_user_id)
   );
