-- Add backup person to run-of-show items (mirrors service_plan_role_slots.backup_user_id)
alter table public.service_plan_items
  add column if not exists backup_user_id uuid references auth.users(id) on delete set null;

create index if not exists service_plan_items_backup_user_idx
  on public.service_plan_items(backup_user_id)
  where backup_user_id is not null;
