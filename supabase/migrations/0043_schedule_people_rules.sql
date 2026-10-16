-- Audit follow-ups to 0041's normalize_schedule_row:
--   • The MEMBER→SERVICE promotion ran on every write (re-promoting people an
--     admin had demoted) and didn't check the person's church.
--   • Slots/parts could be pointed at a profile from another church (the FK
--     only checks the profile exists) — now refused.

create or replace function public.normalize_schedule_row()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_status text;
  v_church uuid;
  v_people_changed boolean;
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

  v_people_changed := tg_op = 'INSERT'
    or new.assigned_user_id is distinct from old.assigned_user_id
    or new.backup_user_id is distinct from old.backup_user_id;

  if v_people_changed then
    select church_id into v_church from public.service_plans where id = new.plan_id;

    -- Only people from this plan's church can be newly scheduled on it
    -- (checks just the person who changed, so a row whose old assignee has
    -- since left can still be edited).
    if (tg_op = 'INSERT' or new.assigned_user_id is distinct from old.assigned_user_id)
       and new.assigned_user_id is not null
       and not exists (select 1 from public.profiles where id = new.assigned_user_id and church_id = v_church) then
      raise exception 'Only members of this church can be scheduled.';
    end if;
    if (tg_op = 'INSERT' or new.backup_user_id is distinct from old.backup_user_id)
       and new.backup_user_id is not null
       and not exists (select 1 from public.profiles where id = new.backup_user_id and church_id = v_church) then
      raise exception 'Only members of this church can be scheduled.';
    end if;

    -- Being newly put on the schedule makes you service team (Serve tab,
    -- role names, reminders). Unrelated edits never re-promote someone an
    -- admin deliberately demoted.
    update public.profiles
       set role = 'SERVICE'
     where id in (new.assigned_user_id, new.backup_user_id)
       and role = 'MEMBER'
       and church_id = v_church;
  end if;

  return new;
end;
$$;


-- ─── Leaving a church releases your future serving slots ──────────────────
-- (account deletion already did this; removal from a church didn't, which left
-- ex-members on upcoming schedules with nobody able to answer for them)

create or replace function public.release_future_assignments(p_user_id uuid, p_church_id uuid)
returns void
language sql
security definer
set search_path = public
set row_security = off
as $$
  -- Primary leaves: the trigger's rules apply — backup steps up, or the slot reopens.
  update public.service_plan_role_slots s
     set assigned_user_id = s.backup_user_id, backup_user_id = null
    from public.service_plans p
   where p.id = s.plan_id and p.church_id = p_church_id and p.service_date >= current_date
     and s.assigned_user_id = p_user_id;
  update public.service_plan_role_slots s set backup_user_id = null
    from public.service_plans p
   where p.id = s.plan_id and p.church_id = p_church_id and p.service_date >= current_date
     and s.backup_user_id = p_user_id;
  update public.service_plan_items i
     set assigned_user_id = i.backup_user_id, backup_user_id = null
    from public.service_plans p
   where p.id = i.plan_id and p.church_id = p_church_id and p.service_date >= current_date
     and i.assigned_user_id = p_user_id;
  update public.service_plan_items i set backup_user_id = null
    from public.service_plans p
   where p.id = i.plan_id and p.church_id = p_church_id and p.service_date >= current_date
     and i.backup_user_id = p_user_id;
$$;
revoke all on function public.release_future_assignments(uuid, uuid) from public, anon, authenticated;

create or replace function public.admin_remove_member_from_church(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_admin_church uuid;
  v_admin_role public.role_enum;
  v_target_church uuid;
  v_target_role public.role_enum;
  v_admin_count int;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select church_id, role into v_admin_church, v_admin_role from public.profiles where id = auth.uid();
  if v_admin_role is distinct from 'ADMIN'::public.role_enum then raise exception 'Forbidden: administrators only'; end if;
  if v_admin_church is null then raise exception 'Forbidden: no church on your profile'; end if;
  if p_user_id = auth.uid() then raise exception 'Cannot remove yourself from the church'; end if;

  select church_id, role into v_target_church, v_target_role from public.profiles where id = p_user_id;
  if not found then raise exception 'Member not found'; end if;
  if v_target_church is distinct from v_admin_church then raise exception 'Forbidden: member is not in your church'; end if;

  if v_target_role = 'ADMIN'::public.role_enum then
    select count(*)::int into v_admin_count from public.profiles
     where church_id = v_admin_church and role = 'ADMIN'::public.role_enum and coalesce(disabled, false) = false;
    if v_admin_count <= 1 then raise exception 'Cannot remove the last administrator from the church'; end if;
  end if;

  perform public.release_future_assignments(p_user_id, v_admin_church);
  update public.profiles set church_id = null, role = 'MEMBER' where id = p_user_id and church_id = v_admin_church;
end;
$$;
grant execute on function public.admin_remove_member_from_church(uuid) to authenticated;
