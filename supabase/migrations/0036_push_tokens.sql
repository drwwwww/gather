-- Stores each member's Expo push token so the notification dispatcher can
-- send actual push notifications, not just log rows + email. Self-writable
-- via the existing profiles_update RLS policy (id = auth.uid()).

alter table public.profiles
  add column if not exists expo_push_token text;
