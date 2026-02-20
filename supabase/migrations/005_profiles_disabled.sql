-- Add disabled flag to profiles for admin-controlled access
alter table public.profiles
  add column if not exists disabled boolean not null default false;
