-- Demo seed data
-- Create church
insert into public.churches (id, name, slug)
values ('11111111-1111-1111-1111-111111111111', 'Demo Church', 'demo-church')
on conflict do nothing;

-- Ministries
insert into public.ministries (id, church_id, name)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Worship'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Tech')
on conflict do nothing;

-- Service Times
insert into public.service_times (id, church_id, name, day_of_week, start_time, timezone)
values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Sunday 9AM', 0, '09:00', 'America/New_York')
on conflict do nothing;

-- Volunteer Roles
insert into public.volunteer_roles (id, church_id, ministry_id, name, description)
values
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Worship Leader', 'Lead worship set'),
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Sound Engineer', 'Manage audio')
on conflict do nothing;

-- Volunteer Assignments
insert into public.volunteer_assignments (id, church_id, service_time_id, role_id, assigned_user_id, status, notes, scheduled_date)
values
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', null, 'OPEN', 'Looking for volunteer', (current_date + 7)),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', null, 'OPEN', 'Need coverage', (current_date + 7))
on conflict do nothing;

-- Announcements
insert into public.announcements (id, church_id, title, body, audience, publish_at)
values
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Welcome to Gather', 'Thanks for joining our community!', 'ALL', now())
on conflict do nothing;

-- Events
insert into public.events (id, church_id, title, description, location, start_at, end_at, audience)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Community Night', 'Food and fellowship.', 'Fellowship Hall', now() + interval '10 days', now() + interval '10 days 2 hours', 'ALL')
on conflict do nothing;

-- Optional: Profiles for existing users by email
-- Replace emails with real users created in Supabase Auth
insert into public.profiles (id, church_id, full_name, email, role)
select u.id, '11111111-1111-1111-1111-111111111111', 'Demo Admin', u.email, 'ADMIN'
from auth.users u
where u.email = 'admin@example.com'
on conflict do nothing;
