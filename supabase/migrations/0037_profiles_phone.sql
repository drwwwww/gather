-- Members can now sign up/in with a phone number instead of email (password
-- auth, no SMS/OTP — see CLAUDE.md). Stores the phone here so admin screens
-- and profile lookups have something to display for phone-only accounts.

alter table public.profiles
  add column if not exists phone text;

create index if not exists idx_profiles_phone on public.profiles(phone) where phone is not null;
