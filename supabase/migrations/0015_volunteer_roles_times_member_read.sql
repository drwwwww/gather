-- Let all church members read volunteer role names and service times (bulletin / directory labels).
create policy "volunteer_roles_member_select" on public.volunteer_roles
for select
using (
  public.is_member()
  and church_id = public.current_user_church_id()
);

create policy "service_times_member_select" on public.service_times
for select
using (
  public.is_member()
  and church_id = public.current_user_church_id()
);
