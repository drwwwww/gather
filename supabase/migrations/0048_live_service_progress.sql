-- 0048: Live service progress.
-- When a run-of-show step is marked DONE or SKIPPED (web Live Service or mobile
-- Run service — both go through set_plan_item_status), the people involved hear
-- about it, written to notification_log in the database so it works from any
-- client:
--   • STEP_THANKS    — the person who led a finished step is thanked (push).
--   • STEP_PROGRESS  — everyone with a later step learns where the service is;
--                      only the next person to serve gets a push ("You're up next"),
--                      the rest get a quiet in-app update with how far away
--                      they are, so a 10-step service doesn't buzz a phone 10×.
--   • ASSIGNMENT_MISSED — admins: a step was done/skipped and its person never
--                      checked in.
--   • SERVICE_COMPLETE  — admins, once: the whole run of show is finished, with
--                      everyone scheduled who never checked in.
-- Rows that should also go out as a push carry payload.push = true; the web
-- route /api/live/push sends them and stamps payload.pushed.
-- Only on the service day (church timezone) — marking steps while planning
-- ahead notifies no one.

alter table public.service_plans add column if not exists completed_at timestamptz;

create or replace function public.notify_plan_item_progress()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_plan record;
  v_today date;
  v_later record;
  v_admin record;
  v_name text;
  v_missed jsonb;
  v_left int;
  v_next_pos int;
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status::text not in ('DONE', 'SKIPPED') then
    -- Undoing a step reopens a finished service.
    if new.status::text = 'PLANNED' then
      update public.service_plans set completed_at = null where id = new.plan_id and completed_at is not null;
    end if;
    return new;
  end if;

  select p.id, p.church_id, p.title, p.service_date, coalesce(c.timezone, 'America/New_York') as tz
    into v_plan
    from public.service_plans p join public.churches c on c.id = p.church_id
   where p.id = new.plan_id;
  if not found then return new; end if;
  v_today := (now() at time zone v_plan.tz)::date;
  if v_plan.service_date <> v_today then return new; end if;

  -- Thank whoever led the finished step (once per step, even if it's toggled).
  if new.status::text = 'DONE' and new.assigned_user_id is not null
     and not exists (
       select 1 from public.notification_log
        where type = 'STEP_THANKS' and user_id = new.assigned_user_id
          and payload->>'item_id' = new.id::text and sent_at > now() - interval '6 hours'
     ) then
    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    values (v_plan.church_id, new.assigned_user_id, 'STEP_THANKS', jsonb_build_object(
      'plan_id', v_plan.id, 'item_id', new.id, 'title', coalesce(nullif(trim(new.title), ''), 'your part'), 'push', true
    ), now());
  end if;

  -- The next person to serve (even if an unassigned step, like a video, comes first) gets the push.
  select min(i.position) into v_next_pos
    from public.service_plan_items i
   where i.plan_id = new.plan_id and i.status::text = 'PLANNED' and i.position > new.position
     and i.assigned_user_id is not null and i.assigned_user_id is distinct from new.assigned_user_id;

  -- Everyone with a later, still-planned step: one update each (their nearest step).
  for v_later in
    with upcoming as (
      select i.id, i.title, i.assigned_user_id, i.position,
             row_number() over (order by i.position) as steps_away,
             coalesce(sum(coalesce(i.duration_minutes, 0)) over (order by i.position rows between unbounded preceding and 1 preceding), 0) as minutes_away
        from public.service_plan_items i
       where i.plan_id = new.plan_id and i.status::text = 'PLANNED' and i.position > new.position
    )
    select distinct on (assigned_user_id) *
      from upcoming
     where assigned_user_id is not null and assigned_user_id is distinct from new.assigned_user_id
     order by assigned_user_id, position
  loop
    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    values (v_plan.church_id, v_later.assigned_user_id, 'STEP_PROGRESS', jsonb_build_object(
      'plan_id', v_plan.id,
      'item_id', v_later.id,
      'done_title', coalesce(nullif(trim(new.title), ''), 'A step'),
      'done_status', new.status::text,
      'your_title', coalesce(nullif(trim(v_later.title), ''), 'your part'),
      'steps_away', v_later.steps_away,
      'minutes_away', v_later.minutes_away,
      'next_up', v_later.position = v_next_pos,
      'push', v_later.position = v_next_pos
    ), now());
  end loop;

  -- Missed: the step's person never checked in anywhere in this service.
  if new.assigned_user_id is not null
     and new.checked_in_at is null
     and not exists (select 1 from public.service_plan_role_slots s where s.plan_id = new.plan_id and s.assigned_user_id = new.assigned_user_id and s.checked_in_at is not null)
     and not exists (select 1 from public.service_plan_items i where i.plan_id = new.plan_id and i.assigned_user_id = new.assigned_user_id and i.checked_in_at is not null) then
    select coalesce(nullif(trim(full_name), ''), email, 'Someone') into v_name from public.profiles where id = new.assigned_user_id;
    for v_admin in
      select id from public.profiles where church_id = v_plan.church_id and role = 'ADMIN'::public.role_enum and coalesce(disabled, false) = false
         and id <> new.assigned_user_id  -- never tell an admin they missed their own part
    loop
      insert into public.notification_log (church_id, user_id, type, payload, sent_at)
      values (v_plan.church_id, v_admin.id, 'ASSIGNMENT_MISSED', jsonb_build_object(
        'plan_id', v_plan.id, 'item_id', new.id, 'volunteer_id', new.assigned_user_id, 'volunteer_name', v_name,
        'label', coalesce(nullif(trim(new.title), ''), 'their step'), 'step_status', new.status::text
      ), now());
    end loop;
  end if;

  -- Whole run of show finished → one summary for admins.
  select count(*) into v_left from public.service_plan_items where plan_id = new.plan_id and status::text = 'PLANNED' and id <> new.id;
  if v_left = 0 and not exists (select 1 from public.service_plans where id = new.plan_id and completed_at is not null) then
    update public.service_plans set completed_at = now() where id = new.plan_id;
    select coalesce(jsonb_agg(distinct coalesce(nullif(trim(pr.full_name), ''), pr.email)), '[]'::jsonb) into v_missed
      from (
        select s.assigned_user_id as uid from public.service_plan_role_slots s
         where s.plan_id = new.plan_id and s.assigned_user_id is not null and s.status::text <> 'DECLINED'
        union
        select i.assigned_user_id from public.service_plan_items i
         where i.plan_id = new.plan_id and i.assigned_user_id is not null and coalesce(i.assignment_status::text, '') <> 'DECLINED'
      ) team
      join public.profiles pr on pr.id = team.uid
     where not exists (select 1 from public.service_plan_role_slots s where s.plan_id = new.plan_id and s.assigned_user_id = team.uid and s.checked_in_at is not null)
       and not exists (select 1 from public.service_plan_items i where i.plan_id = new.plan_id and i.assigned_user_id = team.uid and i.checked_in_at is not null);
    for v_admin in
      select id from public.profiles where church_id = v_plan.church_id and role = 'ADMIN'::public.role_enum and coalesce(disabled, false) = false
    loop
      insert into public.notification_log (church_id, user_id, type, payload, sent_at)
      values (v_plan.church_id, v_admin.id, 'SERVICE_COMPLETE', jsonb_build_object(
        'plan_id', v_plan.id, 'title', v_plan.title, 'missed', v_missed
      ), now());
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_plan_item_progress on public.service_plan_items;
create trigger trg_notify_plan_item_progress
after update of status on public.service_plan_items
for each row execute function public.notify_plan_item_progress();
