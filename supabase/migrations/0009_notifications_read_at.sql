alter table if exists public.notification_log
  add column if not exists read_at timestamptz;

create index if not exists idx_notification_log_read_at
  on public.notification_log(read_at);
