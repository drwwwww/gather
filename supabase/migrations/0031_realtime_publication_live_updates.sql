-- Enables Supabase Realtime (postgres_changes) on the tables the mobile app
-- needs to live-toast: new events/announcements while a member is in-app, and
-- new assignments for the "first assignment" welcome card. Without this,
-- postgres_changes subscriptions silently receive nothing — these tables were
-- never added to the supabase_realtime publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'announcements'
  ) then
    alter publication supabase_realtime add table public.announcements;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_plan_role_slots'
  ) then
    alter publication supabase_realtime add table public.service_plan_role_slots;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_plan_items'
  ) then
    alter publication supabase_realtime add table public.service_plan_items;
  end if;
end $$;
