-- Atomic respond + backup-promotion function.
-- Runs SECURITY DEFINER so it can bypass RLS to re-assign the row when
-- the primary declines and a backup volunteer exists.
-- Callable by any authenticated member of the same church.

create or replace function public.respond_assignment(
  p_source   text,   -- 'volunteer_assignment' | 'plan_role_slot' | 'plan_item'
  p_id       uuid,
  p_response text    -- 'CONFIRMED' | 'DECLINED'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assigned_user_id   uuid;
  v_backup_user_id     uuid;
  v_church_id          uuid;
  v_caller_church_id   uuid;
  v_plan_id            uuid;
  v_is_primary         boolean;
begin
  if p_response not in ('CONFIRMED', 'DECLINED') then
    return jsonb_build_object('error', 'invalid response: must be CONFIRMED or DECLINED');
  end if;

  v_caller_church_id := public.current_user_church_id();

  -- ── volunteer_assignments ────────────────────────────────────────────────
  if p_source = 'volunteer_assignment' then
    select assigned_user_id, backup_user_id, church_id
      into v_assigned_user_id, v_backup_user_id, v_church_id
      from public.volunteer_assignments
     where id = p_id;

    if not found or v_church_id is distinct from v_caller_church_id then
      return jsonb_build_object('error', 'not found');
    end if;

    v_is_primary := v_assigned_user_id = auth.uid();
    if not v_is_primary and v_backup_user_id is distinct from auth.uid() then
      return jsonb_build_object('error', 'permission denied');
    end if;

    if p_response = 'DECLINED' and v_is_primary and v_backup_user_id is not null then
      update public.volunteer_assignments
         set assigned_user_id = v_backup_user_id,
             backup_user_id   = null,
             status           = 'ASSIGNED'
       where id = p_id;
      return jsonb_build_object('promoted', true, 'new_assigned', v_backup_user_id);
    else
      update public.volunteer_assignments set status = p_response where id = p_id;
      return jsonb_build_object('promoted', false);
    end if;

  -- ── service_plan_role_slots ──────────────────────────────────────────────
  elsif p_source = 'plan_role_slot' then
    select assigned_user_id, backup_user_id, plan_id
      into v_assigned_user_id, v_backup_user_id, v_plan_id
      from public.service_plan_role_slots
     where id = p_id;

    if not found then
      return jsonb_build_object('error', 'not found');
    end if;

    if not exists (
      select 1 from public.service_plans p
       where p.id = v_plan_id and p.church_id = v_caller_church_id
    ) then
      return jsonb_build_object('error', 'not found');
    end if;

    v_is_primary := v_assigned_user_id = auth.uid();
    if not v_is_primary and v_backup_user_id is distinct from auth.uid() then
      return jsonb_build_object('error', 'permission denied');
    end if;

    if p_response = 'DECLINED' and v_is_primary and v_backup_user_id is not null then
      update public.service_plan_role_slots
         set assigned_user_id = v_backup_user_id,
             backup_user_id   = null,
             status           = 'ASSIGNED'
       where id = p_id;
      return jsonb_build_object('promoted', true, 'new_assigned', v_backup_user_id);
    else
      update public.service_plan_role_slots set status = p_response where id = p_id;
      return jsonb_build_object('promoted', false);
    end if;

  -- ── service_plan_items ───────────────────────────────────────────────────
  elsif p_source = 'plan_item' then
    select assigned_user_id, backup_user_id, plan_id
      into v_assigned_user_id, v_backup_user_id, v_plan_id
      from public.service_plan_items
     where id = p_id;

    if not found then
      return jsonb_build_object('error', 'not found');
    end if;

    if not exists (
      select 1 from public.service_plans p
       where p.id = v_plan_id and p.church_id = v_caller_church_id
    ) then
      return jsonb_build_object('error', 'not found');
    end if;

    v_is_primary := v_assigned_user_id = auth.uid();
    if not v_is_primary and v_backup_user_id is distinct from auth.uid() then
      return jsonb_build_object('error', 'permission denied');
    end if;

    if p_response = 'DECLINED' and v_is_primary and v_backup_user_id is not null then
      update public.service_plan_items
         set assigned_user_id  = v_backup_user_id,
             backup_user_id    = null,
             assignment_status = 'ASSIGNED'
       where id = p_id;
      return jsonb_build_object('promoted', true, 'new_assigned', v_backup_user_id);
    else
      update public.service_plan_items set assignment_status = p_response where id = p_id;
      return jsonb_build_object('promoted', false);
    end if;

  end if;

  return jsonb_build_object('error', 'unknown source');
end;
$$;

grant execute on function public.respond_assignment(text, uuid, text) to authenticated;
