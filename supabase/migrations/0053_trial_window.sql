-- A trial that ends, on the plan people should fall in love with.
--
-- Before: a church created at sign-up got plan 'parish', status 'trialing' and
-- no end date — a free plan forever, without Gather AI to try. Now:
--   * new churches trial the Congregation plan (Gather AI included) for 30 days
--     ("reverse trial": you keep what you've used by choosing a plan);
--   * churches.trial_ends_at records when; only the service role (Stripe webhook,
--     support) can move it, same as the other billing columns;
--   * once a church has a Stripe subscription, Stripe's own status and period
--     drive everything and trial_ends_at is ignored.
-- What happens after the trial ends without a plan is decided in the apps
-- (web shows a banner and turns Gather AI off); nothing is deleted.

alter table public.churches add column if not exists trial_ends_at timestamptz;
alter table public.churches alter column trial_ends_at set default (now() + interval '30 days');
alter table public.churches alter column plan set default 'congregation';

-- Existing trialing churches without a subscription get the same 30 days from creation.
update public.churches
   set trial_ends_at = created_at + interval '30 days'
 where trial_ends_at is null
   and plan_status = 'trialing'
   and stripe_subscription_id is null;

create or replace function public.guard_church_billing()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.plan := 'congregation';
      new.plan_status := 'trialing';
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
      new.plan_renews_at := null;
      new.trial_ends_at := now() + interval '30 days';
    else
      new.plan := old.plan;
      new.plan_status := old.plan_status;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      new.plan_renews_at := old.plan_renews_at;
      new.trial_ends_at := old.trial_ends_at;
    end if;
  end if;
  return new;
end;
$$;
