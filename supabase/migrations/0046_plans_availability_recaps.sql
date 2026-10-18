-- 0046: subscription plan on churches, volunteer away dates, service recaps.

-- ── Plan / billing ───────────────────────────────────────────────────────────
alter table public.churches add column if not exists plan text not null default 'parish';
alter table public.churches add column if not exists plan_status text not null default 'trialing';
alter table public.churches add column if not exists stripe_customer_id text;
alter table public.churches add column if not exists stripe_subscription_id text;
alter table public.churches add column if not exists plan_renews_at timestamptz;

do $$ begin
  alter table public.churches add constraint churches_plan_check check (plan in ('parish','congregation','network'));
exception when duplicate_object then null; end $$;

create index if not exists idx_churches_stripe_subscription on public.churches(stripe_subscription_id);

-- Admins can edit their church row (name, address, …) but never their own plan:
-- plan/billing columns only change through the service role (Stripe webhook).
create or replace function public.guard_church_billing()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.plan := 'parish';
      new.plan_status := 'trialing';
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
      new.plan_renews_at := null;
    else
      new.plan := old.plan;
      new.plan_status := old.plan_status;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      new.plan_renews_at := old.plan_renews_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_church_billing on public.churches;
create trigger trg_guard_church_billing
before insert or update on public.churches
for each row execute function public.guard_church_billing();

-- Demo church shows the Congregation feature set.
update public.churches set plan = 'congregation', plan_status = 'active' where slug = 'grace-community';

-- ── Volunteer away dates ─────────────────────────────────────────────────────
create table if not exists public.volunteer_unavailability (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default now(),
  constraint volunteer_unavailability_range check (end_date >= start_date)
);

create index if not exists idx_unavailability_church_dates on public.volunteer_unavailability(church_id, start_date, end_date);
create unique index if not exists uq_unavailability_user_day on public.volunteer_unavailability(user_id, start_date, end_date);

alter table public.volunteer_unavailability enable row level security;

drop policy if exists "unavailability_select" on public.volunteer_unavailability;
create policy "unavailability_select" on public.volunteer_unavailability
for select using (
  user_id = auth.uid()
  or (church_id = public.current_user_church_id() and public.is_admin())
);

-- Volunteers manage their own dates; admins can mark anyone in their church away.
drop policy if exists "unavailability_insert" on public.volunteer_unavailability;
create policy "unavailability_insert" on public.volunteer_unavailability
for insert with check (
  church_id = public.current_user_church_id()
  and (user_id = auth.uid() or public.is_admin())
  and exists (select 1 from public.profiles p where p.id = volunteer_unavailability.user_id and p.church_id = volunteer_unavailability.church_id)
);

drop policy if exists "unavailability_delete" on public.volunteer_unavailability;
create policy "unavailability_delete" on public.volunteer_unavailability
for delete using (
  user_id = auth.uid()
  or (church_id = public.current_user_church_id() and public.is_admin())
);

-- ── Service recaps ───────────────────────────────────────────────────────────
alter table public.service_plans add column if not exists recap_sent_at timestamptz;
