-- Add address to churches for sign up and dashboard display
alter table public.churches
  add column if not exists address text;
