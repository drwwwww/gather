-- Add cancel flag for events
alter table public.events
  add column if not exists is_cancelled boolean not null default false;

create index if not exists events_church_start_cancelled_idx
  on public.events (church_id, start_at, is_cancelled);
