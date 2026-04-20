-- Mobile: members/service can see an in-church directory (non-disabled peers).
-- Service team can read service_times and volunteer_roles for assignment/plan labels.

create policy "profiles_church_peers_select" on public.profiles
for select
using (
  church_id = public.current_user_church_id()
  and (public.is_member() or public.is_service())
  and coalesce(disabled, false) = false
);

create policy "service_times_service_select" on public.service_times
for select
using (
  public.is_service()
  and church_id = public.current_user_church_id()
);

create policy "volunteer_roles_service_select" on public.volunteer_roles
for select
using (
  public.is_service()
  and church_id = public.current_user_church_id()
);
