-- 0050: tell people when something is waiting for them.
--
-- 1. New assignments. When someone is put on a plan (as the person serving or
--    the backup, on a team spot or a step) they get ASSIGNMENT_NEW in the app
--    and a push: "You're on the team for 9:00 Service". The push waits ~45s and
--    is only sent if they're still on that plan, so an admin trying names in the
--    editor doesn't buzz five phones. One notice per person per plan.
-- 2. Confirms. Admins already hear about declines (0047); now they hear about
--    confirms too (ASSIGNMENT_CONFIRMED). Neither is sent about yourself.
-- 3. Events and announcements. New events (not cancelled, still upcoming) and
--    announcements (once their publish time arrives) notify everyone in their
--    audience — the same people who can see them — except whoever posted.
--    A repeating event made in one go notifies once ("and 3 more dates").
-- 4. Service-time changes. Changing a service's start time on Account now moves
--    the upcoming plans that were using the old time, so the app shows the new
--    one (and the "starts soon" notice goes out at the right moment).
--
-- Pushes leave the database through pg_net (0049); pg_cron runs the queue
-- every minute.

-- ---------------------------------------------------------------- columns
alter table public.events add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table public.events add column if not exists notified_at timestamptz;
alter table public.announcements add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table public.announcements add column if not exists notified_at timestamptz;

-- Nothing already posted gets announced now; scheduled announcements still go
-- out when their time comes.
update public.events set notified_at = now() where notified_at is null;
update public.announcements set notified_at = now()
 where notified_at is null and (publish_at is null or publish_at <= now());

-- Same rule as the select policies: admins see everything, the service team
-- sees ALL/MEMBER/SERVICE, members see ALL/MEMBER.
create or replace function public.audience_reaches(p_audience public.audience_enum, p_role public.role_enum)
returns boolean
language sql
immutable
as $$
  select p_role = 'ADMIN'
      or p_audience = 'ALL'
      or (p_audience = 'MEMBER' and p_role in ('MEMBER', 'SERVICE'))
      or (p_audience = 'SERVICE' and p_role = 'SERVICE');
$$;

-- ---------------------------------------------------------------- 1. new assignments
create or replace function public.queue_assignment_notice()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_plan record;
  v_uid uuid;
  v_label text;
  v_service text;
  v_when text;
  v_backup boolean;
begin
  select p.id, p.church_id, p.service_date, p.title,
         coalesce(nullif(p.start_time, ''), to_char(st.start_time, 'HH24:MI')) as hhmm,
         st.name as service_name,
         coalesce(c.timezone, 'America/New_York') as tz
    into v_plan
    from public.service_plans p
    join public.churches c on c.id = p.church_id
    left join public.service_times st on st.id = p.service_time_id
   where p.id = new.plan_id;
  if not found or v_plan.service_date < (now() at time zone v_plan.tz)::date then
    return new;
  end if;

  if tg_table_name = 'service_plan_role_slots' then
    select name into v_label from public.volunteer_roles where id = new.role_id;
  else
    v_label := nullif(trim(new.title), '');
  end if;

  v_service := coalesce(nullif(trim(v_plan.service_name), ''), nullif(trim(v_plan.title), ''), 'the service');
  v_when := to_char(v_plan.service_date, 'FMDay, FMMonth FMDD')
         || coalesce(' · ' || to_char(left(v_plan.hhmm, 5)::time, 'FMHH12:MI AM'), '');

  foreach v_uid in array array[new.assigned_user_id, new.backup_user_id] loop
    continue when v_uid is null;
    continue when tg_op = 'UPDATE' and (v_uid = old.assigned_user_id or v_uid = old.backup_user_id);
    continue when v_uid = auth.uid();
    continue when exists (
      select 1 from public.notification_log n
       where n.user_id = v_uid and n.type = 'ASSIGNMENT_NEW'
         and n.payload->>'plan_id' = v_plan.id::text
         and n.payload->>'pushed' is null
    );
    v_backup := v_uid = new.backup_user_id and v_uid is distinct from new.assigned_user_id;

    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    values (v_plan.church_id, v_uid, 'ASSIGNMENT_NEW', jsonb_build_object(
      'plan_id', v_plan.id,
      'service_date', v_plan.service_date,
      'title', v_service,
      'when_label', v_when,
      'label', v_label,
      'as_backup', v_backup,
      'push', true,
      'delay_seconds', 45,
      'push_title', case when v_backup then 'You''re a backup for ' || v_service
                         else 'You''re on the team for ' || v_service end,
      'push_body', v_when || '. Open Gather to see your part'
                   || case when v_backup then '.' else ' and confirm.' end
    ), now());
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_queue_assignment_notice on public.service_plan_role_slots;
create trigger trg_queue_assignment_notice
after insert or update of assigned_user_id, backup_user_id on public.service_plan_role_slots
for each row execute function public.queue_assignment_notice();

drop trigger if exists trg_queue_assignment_notice on public.service_plan_items;
create trigger trg_queue_assignment_notice
after insert or update of assigned_user_id, backup_user_id on public.service_plan_items
for each row execute function public.queue_assignment_notice();

-- ---------------------------------------------------------------- 2. confirms (and declines) to admins
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

    if coalesce(v_prev, '') <> p_response then
      select coalesce(nullif(trim(full_name), ''), email, 'A volunteer') into v_name from public.profiles where id = v_uid;
      for v_admin in
        select id from public.profiles
         where church_id = v_church and role = 'ADMIN'::public.role_enum
           and coalesce(disabled, false) = false and id <> v_uid
      loop
        insert into public.notification_log (church_id, user_id, type, payload, sent_at)
        values (v_church, v_admin.id,
          case when p_response = 'DECLINED' then 'ASSIGNMENT_DECLINED' else 'ASSIGNMENT_CONFIRMED' end,
          jsonb_build_object(
            'plan_id', v_plan_id,
            'scheduled_date', v_date,
            'volunteer_id', v_uid,
            'volunteer_name', v_name,
            'label', coalesce(v_label, 'their assignment'),
            'was_confirmed', v_prev = 'CONFIRMED',
            'backup_promoted', p_response = 'DECLINED' and v_backup is not null
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

-- ---------------------------------------------------------------- 3. events + announcements
create or replace function public.queue_content_notices()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_e record;
  v_a record;
  v_n int := 0;
  v_when text;
begin
  -- Events, grouped so a repeating series announces once.
  for v_e in
    with claimed as (
      update public.events set notified_at = now()
       where notified_at is null
         and coalesce(is_cancelled, false) = false
         and start_at > now()
      returning id, church_id, title, audience, start_at, created_by
    )
    select cl.church_id, cl.title, cl.audience, cl.created_by,
           (array_agg(cl.id order by cl.start_at))[1] as first_id,
           min(cl.start_at) as first_start,
           count(*) as n,
           coalesce(c.timezone, 'America/New_York') as tz
      from claimed cl join public.churches c on c.id = cl.church_id
     group by cl.church_id, cl.title, cl.audience, cl.created_by, c.timezone
  loop
    v_when := to_char(v_e.first_start at time zone v_e.tz, 'FMDay, FMMonth FMDD "at" FMHH12:MI AM');
    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    select v_e.church_id, pr.id, 'EVENT_NEW', jsonb_build_object(
             'event_id', v_e.first_id,
             'title', v_e.title,
             'start_at', v_e.first_start,
             'when_label', v_when,
             'more_dates', v_e.n - 1,
             'push', true,
             'push_title', 'New event: ' || v_e.title,
             'push_body', v_when
               || case when v_e.n > 1 then ' (and ' || (v_e.n - 1) || ' more ' || case when v_e.n = 2 then 'date' else 'dates' end || ')' else '' end
               || '. Tap to see details and RSVP.'
           ), now()
      from public.profiles pr
     where pr.church_id = v_e.church_id
       and coalesce(pr.disabled, false) = false
       and public.audience_reaches(v_e.audience, pr.role)
       and pr.id is distinct from v_e.created_by;
    v_n := v_n + 1;
  end loop;

  -- Announcements, once their publish time has arrived.
  for v_a in
    update public.announcements set notified_at = now()
     where notified_at is null and (publish_at is null or publish_at <= now())
    returning id, church_id, title, body, audience, created_by
  loop
    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    select v_a.church_id, pr.id, 'ANNOUNCEMENT_NEW', jsonb_build_object(
             'announcement_id', v_a.id,
             'title', v_a.title,
             'preview', left(regexp_replace(coalesce(v_a.body, ''), '\s+', ' ', 'g'), 140),
             'push', true,
             'push_title', v_a.title,
             'push_body', left(regexp_replace(coalesce(v_a.body, ''), '\s+', ' ', 'g'), 140)
           ), now()
      from public.profiles pr
     where pr.church_id = v_a.church_id
       and coalesce(pr.disabled, false) = false
       and public.audience_reaches(v_a.audience, pr.role)
       and pr.id is distinct from v_a.created_by;
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;

-- ---------------------------------------------------------------- push sender
create or replace function public.send_queued_pushes()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_messages jsonb;
  v_batch jsonb;
  v_i int := 0;
begin
  -- Assignment notices for people who were taken off the plan before the push went out.
  delete from public.notification_log n
   where n.type = 'ASSIGNMENT_NEW'
     and n.payload->>'pushed' is null
     and not exists (
       select 1 from public.service_plan_role_slots s
        where s.plan_id::text = n.payload->>'plan_id' and n.user_id in (s.assigned_user_id, s.backup_user_id))
     and not exists (
       select 1 from public.service_plan_items i
        where i.plan_id::text = n.payload->>'plan_id' and n.user_id in (i.assigned_user_id, i.backup_user_id));

  with due as (
    select n.id from public.notification_log n
     where n.type in ('ASSIGNMENT_NEW', 'EVENT_NEW', 'ANNOUNCEMENT_NEW')
       and n.payload->>'push' = 'true'
       and n.payload->>'pushed' is null
       and n.sent_at > now() - interval '1 day'
       and n.sent_at <= now() - make_interval(secs => coalesce((n.payload->>'delay_seconds')::int, 0))
     for update skip locked
  ), claimed as (
    update public.notification_log n
       set payload = n.payload || jsonb_build_object('pushed', now())
      from due where n.id = due.id
    returning n.user_id, n.type, n.payload
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'to', pp.expo_push_token,
           'title', c.payload->>'push_title',
           'body', c.payload->>'push_body',
           'sound', 'default',
           'data', jsonb_strip_nulls(jsonb_build_object(
             'type', c.type,
             'plan_id', c.payload->>'plan_id',
             'event_id', c.payload->>'event_id',
             'announcement_id', c.payload->>'announcement_id'))
         )), '[]'::jsonb)
    into v_messages
    from claimed c
    join public.profile_private pp on pp.user_id = c.user_id
   where pp.expo_push_token is not null and pp.expo_push_token <> '';

  while v_i < jsonb_array_length(v_messages) loop
    select coalesce(jsonb_agg(m), '[]'::jsonb) into v_batch
      from (select value as m from jsonb_array_elements(v_messages) with ordinality e(value, n)
             where n > v_i and n <= v_i + 100) b;
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_batch,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
    v_i := v_i + 100;
  end loop;
  return jsonb_array_length(v_messages);
end;
$$;

revoke all on function public.queue_content_notices() from public, anon, authenticated;
revoke all on function public.send_queued_pushes() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('notification-queue') where exists (select 1 from cron.job where jobname = 'notification-queue');
  perform cron.schedule('notification-queue', '* * * * *',
    'select public.queue_content_notices(); select public.send_queued_pushes();');
end $$;

-- ---------------------------------------------------------------- 4. service time changes
create or replace function public.follow_service_time_change()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_tz text;
begin
  if new.start_time is not distinct from old.start_time then
    return new;
  end if;
  select coalesce(timezone, 'America/New_York') into v_tz from public.churches where id = new.church_id;
  update public.service_plans p
     set start_time = to_char(new.start_time, 'HH24:MI'),
         start_notice_sent_at = null
   where p.service_time_id = new.id
     and p.service_date >= (now() at time zone v_tz)::date
     and (nullif(p.start_time, '') is null or left(p.start_time, 5) = to_char(old.start_time, 'HH24:MI'));
  return new;
end;
$$;

drop trigger if exists trg_follow_service_time_change on public.service_times;
create trigger trg_follow_service_time_change
after update of start_time on public.service_times
for each row execute function public.follow_service_time_change();
