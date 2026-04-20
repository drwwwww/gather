-- service_plan_role_slots: let assigned / backup SERVICE members confirm or decline their slot.
-- (volunteer_assignments backup RLS was already handled in 0011)
create policy "service_plan_role_slots_service_update" on public.service_plan_role_slots
for update
using (
  public.is_service()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
)
with check (
  public.is_service()
  and (assigned_user_id = auth.uid() or backup_user_id = auth.uid())
  and exists (
    select 1 from public.service_plans p
    where p.id = plan_id and p.church_id = public.current_user_church_id()
  )
);
