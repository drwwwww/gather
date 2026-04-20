-- Track volunteer confirmation state for run-of-show items that have an assigned person.
-- Separate from the step execution status (PLANNED/DONE/SKIPPED).
alter table public.service_plan_items
  add column if not exists assignment_status public.assignment_status_enum not null default 'OPEN';
