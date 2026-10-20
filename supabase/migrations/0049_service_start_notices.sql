-- 0049: "Service starts soon" for the whole church, and the kind-note follow-up.
--
-- Every 5 minutes (pg_cron) the database looks for services starting within the
-- next 30 minutes (church timezone) and, once per service, tells every active
-- member of that church: an in-app notification (notification_log
-- SERVICE_STARTING) plus a push sent straight to Expo with pg_net — no web
-- server or Vercel cron involved, so it works even if the site is down.
--
-- service_plans.care_note_sent_at backs Live Service's "Send a kind note" to
-- people who didn't check in (sent by /api/live/care), so it goes out once.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

alter table public.service_plans add column if not exists start_notice_sent_at timestamptz;
alter table public.service_plans add column if not exists care_note_sent_at timestamptz;

create or replace function public.send_service_start_notices()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_plan record;
  v_sent int := 0;
  v_messages jsonb;
  v_batch jsonb;
  v_i int;
  v_when text;
begin
  for v_plan in
    with timed as (
      select p.id, p.church_id, p.title, c.name as church_name, st.name as service_name,
             coalesce(nullif(p.start_time, ''), to_char(st.start_time, 'HH24:MI')) as start_hhmm,
             coalesce(c.timezone, 'America/New_York') as tz,
             p.service_date
        from public.service_plans p
        join public.churches c on c.id = p.church_id
        left join public.service_times st on st.id = p.service_time_id
       where p.start_notice_sent_at is null
         and p.service_date between current_date - 1 and current_date + 1
    )
    select *, ((service_date + start_hhmm::time) at time zone tz) as starts_at
      from timed
     where start_hhmm is not null
  loop
    continue when not (v_plan.starts_at > now() and v_plan.starts_at <= now() + interval '30 minutes');

    -- Claim it first so overlapping runs can never double-send.
    update public.service_plans set start_notice_sent_at = now()
     where id = v_plan.id and start_notice_sent_at is null;
    continue when not found;

    v_when := to_char(v_plan.starts_at at time zone v_plan.tz, 'FMHH12:MI AM');

    insert into public.notification_log (church_id, user_id, type, payload, sent_at)
    select v_plan.church_id, pr.id, 'SERVICE_STARTING', jsonb_build_object(
             'plan_id', v_plan.id,
             'title', coalesce(nullif(trim(v_plan.service_name), ''), nullif(trim(v_plan.title), ''), 'The service'),
             'starts_at', v_plan.starts_at,
             'time_label', v_when,
             'church_name', v_plan.church_name
           ), now()
      from public.profiles pr
     where pr.church_id = v_plan.church_id and coalesce(pr.disabled, false) = false;

    select coalesce(jsonb_agg(jsonb_build_object(
             'to', pp.expo_push_token,
             'title', coalesce(nullif(trim(v_plan.service_name), ''), 'The service') || ' starts at ' || v_when,
             'body', 'See you soon at ' || v_plan.church_name || '.',
             'data', jsonb_build_object('type', 'SERVICE_STARTING', 'plan_id', v_plan.id)
           )), '[]'::jsonb)
      into v_messages
      from public.profiles pr
      join public.profile_private pp on pp.user_id = pr.id
     where pr.church_id = v_plan.church_id and coalesce(pr.disabled, false) = false
       and pp.expo_push_token is not null and pp.expo_push_token <> '';

    -- Expo accepts up to 100 messages per request.
    v_i := 0;
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

    v_sent := v_sent + 1;
  end loop;
  return v_sent;
end;
$$;

revoke all on function public.send_service_start_notices() from public, anon, authenticated;

-- Run every 5 minutes (replace the job if this migration is re-applied).
do $$
begin
  perform cron.unschedule('service-start-notices') where exists (select 1 from cron.job where jobname = 'service-start-notices');
  perform cron.schedule('service-start-notices', '*/5 * * * *', 'select public.send_service_start_notices()');
end $$;
