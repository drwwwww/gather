-- Allow any church member (MEMBER or SERVICE) to confirm/decline their own assignments.
-- Previously these policies required is_service() which excluded MEMBER-role users.

-- volunteer_assignments
drop policy if exists "assignments_service_select" on public.volunteer_assignments;
create policy "assignments_service_select" on public.volunteer_assignments
for select
using (
  (public.is_service() or public.is_member())
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid() or status = 'OPEN')
);

drop policy if exists "assignments_service_update" on public.volunteer_assignments;
create policy "assignments_service_update" on public.volunteer_assignments
for update
using (
  (public.is_service() or public.is_member())
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
)
with check (
  (public.is_service() or public.is_member())
  and church_id = public.current_user_church_id()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
);

-- service_plan_role_slots
drop policy if exists "service_plan_role_slots_service_update" on public.service_plan_role_slots;
create policy "service_plan_role_slots_service_update" on public.service_plan_role_slots
for update
using (
  (public.is_service() or public.is_member())
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
)
with check (
  (public.is_service() or public.is_member())
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);

-- service_plan_items (assignment_status column, added in migration 0018)
drop policy if exists "service_plan_items_assigned_update" on public.service_plan_items;
create policy "service_plan_items_assigned_update" on public.service_plan_items
for update
using (
  (public.is_service() or public.is_member())
  and assigned_user_id = auth.uid()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
)
with check (
  (public.is_service() or public.is_member())
  and assigned_user_id = auth.uid()
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);
