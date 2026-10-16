-- 1. Audience: the composers label MEMBER as "Members + service team", but the
--    service-team policies only allowed ALL + SERVICE, so volunteers never saw
--    member-audience announcements or events. Service team now sees ALL,
--    MEMBER and SERVICE (admins see everything via their own policy).
-- 2. Volunteers could UPDATE any column of a slot/part they were on (title,
--    notes, backup, run-of-show status). Answering goes through
--    respond_assignment and check-in through check_in_to_plan, both SECURITY
--    DEFINER, so the direct-write policies are no longer needed.

drop policy if exists "announcements_service_select" on public.announcements;
create policy "announcements_service_select" on public.announcements
for select using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and audience = any (array['ALL', 'MEMBER', 'SERVICE']::public.audience_enum[])
);

drop policy if exists "events_service_select" on public.events;
create policy "events_service_select" on public.events
for select using (
  public.is_service()
  and church_id = public.current_user_church_id()
  and audience = any (array['ALL', 'MEMBER', 'SERVICE']::public.audience_enum[])
);

drop policy if exists "service_plan_items_assigned_update" on public.service_plan_items;
drop policy if exists "service_plan_role_slots_service_update" on public.service_plan_role_slots;
