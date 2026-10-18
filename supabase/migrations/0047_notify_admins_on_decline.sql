-- 0047: volunteers can now change their answer on mobile (confirmed → can't
-- make it, or declined → back in). When a primary backs out, the church's
-- admins get a notification so the gap never goes unnoticed. Same rules as
-- 0041 otherwise.

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
  v_prev text;
  v_label text;
  v_date date;
  v_tz text;
  v_church uuid := public.current_user_church_id();
  v_name text;
  v_admin record;
begin
  if p_response not in ('CONFIRMED', 'DECLINED') then
    return jsonb_build_object('error', 'invalid response: must be CONFIRMED or DECLINED');
  end if;
  if v_uid is null or v_church is null then
    return jsonb_build_object('error', 'not found');
  end if;

  if p_source = 'plan_role_slot' then
    select s.assigned_user_id, s.backup_user_id, s.plan_id, s.status::text, r.name
      into v_assigned, v_backup, v_plan_id, v_prev, v_label
      from public.service_plan_role_slots s
      left join public.volunteer_roles r on r.id = s.role_id
     where s.id = p_id;
  elsif p_source = 'plan_item' then
    select assigned_user_id, backup_user_id, plan_id, assignment_status::text, title
      into v_assigned, v_backup, v_plan_id, v_prev, v_label
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

    if p_response = 'DECLINED' and coalesce(v_prev, '') <> 'DECLINED' then
      select coalesce(nullif(trim(full_name), ''), email, 'A volunteer') into v_name from public.profiles where id = v_uid;
      for v_admin in
        select id from public.profiles
         where church_id = v_church and role = 'ADMIN'::public.role_enum and coalesce(disabled, false) = false
      loop
        insert into public.notification_log (church_id, user_id, type, payload, sent_at)
        values (v_church, v_admin.id, 'ASSIGNMENT_DECLINED', jsonb_build_object(
          'plan_id', v_plan_id,
          'scheduled_date', v_date,
          'volunteer_id', v_uid,
          'volunteer_name', v_name,
          'label', coalesce(v_label, 'their assignment'),
          'was_confirmed', v_prev = 'CONFIRMED',
          'backup_promoted', v_backup is not null
        ), now());
      end loop;
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
