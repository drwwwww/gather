-- 0027 dropped NOT NULL from service_plans.service_time_id but missed service_presets.
-- Presets are now grouped by worship_day, so service_time_id is optional.
ALTER TABLE service_presets ALTER COLUMN service_time_id DROP NOT NULL;
