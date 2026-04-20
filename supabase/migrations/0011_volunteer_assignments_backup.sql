-- Add backup_user_id for volunteer assignments (backup in case primary cannot serve)
alter table public.volunteer_assignments
  add column if not exists backup_user_id uuid references auth.users(id) on delete set null;

-- Update RLS: SERVICE users can see assignments where they are assigned OR backup
drop policy if exists "assignments_service_select" on public.volunteer_assignments;
create policy "assignments_service_select" on public.volunteer_assignments
for select
using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid() or status = 'OPEN')
);

-- Update RLS: SERVICE users can update when they are assigned OR backup
drop policy if exists "assignments_service_update" on public.volunteer_assignments;
create policy "assignments_service_update" on public.volunteer_assignments
for update
using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
)
with check (
  public.is_service()
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
);
