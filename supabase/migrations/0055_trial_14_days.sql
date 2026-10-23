-- Trials are 14 days, not 30 (owner decision, October 2026).
-- New churches: default and the billing guard. Existing trialing churches without
-- a subscription are moved to 14 days from creation.

alter table public.churches alter column trial_ends_at set default (now() + interval '14 days');

update public.churches
   set trial_ends_at = created_at + interval '14 days'
 where stripe_subscription_id is null
   and plan_status = 'trialing'
   and trial_ends_at is not null;

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
      new.trial_ends_at := now() + interval '14 days';
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
