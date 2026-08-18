-- create_service_plan_from_preset (migration 0007) is dead code: it has zero
-- call sites in the app. "Generate from preset" today goes through direct
-- client writes (createPlanRow / fetchPresetItems / replacePlanItems in
-- apps/web/lib/db/servicePlans.ts) instead. This RPC still gates on
-- service_presets.service_time_id, which nothing has written to since presets
-- moved to worship_day-based grouping (migration 0027) -- keeping it around
-- stale and unused is a bigger liability than removing it.
drop function if exists public.create_service_plan_from_preset(uuid, date, uuid);
