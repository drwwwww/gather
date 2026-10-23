-- Read-only once a trial ends without a plan (owner decision, October 2026).
--
-- A church can still sign in and see everything, but nothing it manages can be
-- created, changed or deleted until it chooses a plan: posts, events, service
-- plans and their steps/team, templates, roles, ministries, service times,
-- sign-up slots and the church's own details.
--
-- Deliberately NOT blocked, so members never feel the admin's unpaid bill:
--   * anything done through SECURITY DEFINER RPCs (volunteers answering,
--     check-in, sign-up slots, running the service, removing a member);
--   * a person's own rows (profile, RSVPs, away dates, praying, reports);
--   * the service role (Stripe webhook, support, account deletion).
-- Paying (Stripe webhook updates churches as the service role) lifts it at once.

create or replace function public.church_writable(p_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when c.stripe_subscription_id is not null then c.plan_status in ('active', 'trialing', 'past_due')
      when c.plan_status = 'active' then true
      else c.trial_ends_at is not null and c.trial_ends_at > now()
    end
    from public.churches c
    where c.id = p_church_id
  ), true);
$$;

revoke all on function public.church_writable(uuid) from public, anon;
grant execute on function public.church_writable(uuid) to authenticated;

-- One trigger function for every managed table; TG_ARGV[0] says how to find the church.
-- Not SECURITY DEFINER: current_user must stay the caller's role, so the check
-- below can tell an app user from an RPC or the service role.
create or replace function public.enforce_church_writable()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_row record := coalesce(new, old);
  v_church uuid;
begin
  if current_user not in ('authenticated', 'anon') then
    return coalesce(new, old);
  end if;

  case tg_argv[0]
    when 'church_id' then v_church := (to_jsonb(v_row) ->> 'church_id')::uuid;
    when 'self'      then v_church := (to_jsonb(v_row) ->> 'id')::uuid;
    when 'plan'      then select p.church_id into v_church from public.service_plans p where p.id = (to_jsonb(v_row) ->> 'plan_id')::uuid;
    when 'preset'    then select p.church_id into v_church from public.service_presets p where p.id = (to_jsonb(v_row) ->> 'preset_id')::uuid;
  end case;

  if v_church is not null and not public.church_writable(v_church) then
    raise exception 'READ_ONLY'
      using hint = 'Your Gather trial has ended. Choose a plan on Account to keep editing.',
            errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('announcements', 'church_id'),
      ('events', 'church_id'),
      ('service_plans', 'church_id'),
      ('service_plan_items', 'plan'),
      ('service_plan_role_slots', 'plan'),
      ('service_presets', 'church_id'),
      ('service_preset_items', 'preset'),
      ('volunteer_roles', 'church_id'),
      ('ministries', 'church_id'),
      ('service_times', 'church_id'),
      ('announcement_slots', 'church_id'),
      ('announcement_private', 'church_id'),
      ('churches', 'self')
    ) as x(tbl, mode)
  loop
    execute format('drop trigger if exists trg_read_only_after_trial on public.%I', t.tbl);
    execute format(
      'create trigger trg_read_only_after_trial before insert or update or delete on public.%I for each row execute function public.enforce_church_writable(%L)',
      t.tbl, t.mode
    );
  end loop;
end $$;
