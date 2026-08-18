-- Two RLS gaps surfaced auditing mobile notifications/confirmations/bulletin:
--
-- 1. event_rsvps: the only non-admin SELECT policy was `user_id = auth.uid()`, so a
--    regular MEMBER/SERVICE user's "N going / N maybe" aggregate on mobile only ever
--    counted their own RSVP row — everyone else's rows were invisible under RLS.
--    Broaden SELECT to any authenticated church member for events in their own church,
--    matching how "who's going" already behaves for admins.
--
-- 2. service_plan_items: the assigned-member UPDATE policy (0019) only checked
--    `assigned_user_id = auth.uid()`, unlike the equivalent service_plan_role_slots
--    policy which also allows `backup_user_id = auth.uid()`. This only bites the
--    mobile app's fallback direct-table-update path (used if the respond_assignment
--    RPC call itself fails) — the RPC path already permits backups correctly — but
--    the fallback should behave the same way.

drop policy if exists "rsvps_church_select" on public.event_rsvps;
create policy "rsvps_church_select" on public.event_rsvps
for select
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.church_id = public.current_user_church_id()
  )
);

drop policy if exists "service_plan_items_assigned_update" on public.service_plan_items;
create policy "service_plan_items_assigned_update" on public.service_plan_items
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
