-- respond_assignment has been silently failing on every real call since it was
-- narrowed to plan_role_slot/plan_item in migration 0024:
--   `update ... set status = p_response` / `set assignment_status = p_response`
-- assigns a `text` parameter directly to an `assignment_status_enum` column, which
-- Postgres does not implicitly cast inside PL/pgSQL UPDATE statements (only string
-- *literals* get that implicit cast, not parameters/variables). Every confirm/decline
-- call has been erroring with:
--   42804: column "status" is of type assignment_status_enum but expression is of type text
--
-- Mobile silently falls back to a direct table update when the RPC errors (see
-- AssignmentsScreen.tsx), which is why simple confirm/decline still appeared to work —
-- but that fallback has no backup-promotion logic, so "decline reassigns to backup"
-- has been completely non-functional in production.

create or replace function public.respond_assignment(
  p_source   text,   -- 'plan_role_slot' | 'plan_item'
  p_id       uuid,
  p_response text    -- 'CONFIRMED' | 'DECLINED'
) returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_assigned_user_id   uuid;
  v_backup_user_id     uuid;
  v_caller_church_id   uuid;
  v_plan_id            uuid;
  v_is_primary         boolean;
begin
  if p_response not in ('CONFIRMED', 'DECLINED') then
    return jsonb_build_object('error', 'invalid response: must be CONFIRMED or DECLINED');
  end if;

  v_caller_church_id := public.current_user_church_id();

  if v_caller_church_id is null then
    return jsonb_build_object('error', 'not found');
  end if;

  -- ── service_plan_role_slots ──────────────────────────────────────────────
  if p_source = 'plan_role_slot' then
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
      update public.service_plan_role_slots set status = p_response::assignment_status_enum where id = p_id;
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
      update public.service_plan_items set assignment_status = p_response::assignment_status_enum where id = p_id;
      return jsonb_build_object('promoted', false);
    end if;

  end if;

  return jsonb_build_object('error', 'unknown source');
end;
$$;

grant execute on function public.respond_assignment(text, uuid, text) to authenticated;
