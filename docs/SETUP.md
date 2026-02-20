# Gather Setup

## Prerequisites
- Node.js 18+
- pnpm
- Supabase CLI (optional for local)

## Install
1. pnpm install

## Supabase
1. Create a Supabase project.
2. Copy SUPABASE_URL and SUPABASE_ANON_KEY into .env (based on .env.example).
3. (Optional) Add SUPABASE_SERVICE_ROLE_KEY for server-side jobs.
4. Apply migrations:
   - supabase db push (if using local)
   - Or paste SQL from supabase/migrations into the SQL editor.
5. Run seed data:
   - Execute supabase/seed.sql in SQL editor.

## Run Apps
- Web: pnpm --filter web dev
- Mobile: pnpm --filter mobile start

## Notification Dispatcher
- Endpoint: /api/notifications/dispatch
- Cron-friendly: hit the endpoint on a schedule.

