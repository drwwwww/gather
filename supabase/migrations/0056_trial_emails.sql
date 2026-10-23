-- Trial email sequence: one row per church per email, so the daily job never
-- sends the same one twice. Service role only (RLS on, no policies).
create table if not exists public.trial_email_log (
  church_id uuid not null references public.churches(id) on delete cascade,
  kind text not null check (kind in ('welcome', 'midway', 'ending', 'ended')),
  sent_at timestamptz not null default now(),
  primary key (church_id, kind)
);

alter table public.trial_email_log enable row level security;
