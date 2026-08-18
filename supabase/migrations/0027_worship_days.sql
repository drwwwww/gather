-- Replace service_times UI concept with simpler worship_days
-- Church records which days of the week they worship
ALTER TABLE churches ADD COLUMN IF NOT EXISTS worship_days integer[] DEFAULT '{0}';

-- Migrate existing service_times -> worship_days per church
UPDATE churches c
SET worship_days = COALESCE((
  SELECT ARRAY_AGG(DISTINCT st.day_of_week ORDER BY st.day_of_week)
  FROM service_times st
  WHERE st.church_id = c.id
), '{0}')
WHERE EXISTS (SELECT 1 FROM service_times st WHERE st.church_id = c.id);

-- Presets get a worship_day (day of week 0=Sun..6=Sat) instead of service_time_id grouping
ALTER TABLE service_presets ADD COLUMN IF NOT EXISTS worship_day integer DEFAULT 0;

-- Migrate existing preset service_time_id -> worship_day
UPDATE service_presets sp
SET worship_day = COALESCE((
  SELECT st.day_of_week FROM service_times st WHERE st.id = sp.service_time_id
), 0)
WHERE sp.service_time_id IS NOT NULL;

-- Plans can exist without a service_time (one plan per church per date)
ALTER TABLE service_plans ALTER COLUMN service_time_id DROP NOT NULL;

-- Optional: store the plan start time directly on the plan
ALTER TABLE service_plans ADD COLUMN IF NOT EXISTS start_time text;

-- Migrate existing start_time from linked service_times
UPDATE service_plans sp
SET start_time = (
  SELECT st.start_time::text FROM service_times st WHERE st.id = sp.service_time_id
)
WHERE sp.service_time_id IS NOT NULL AND sp.start_time IS NULL;
