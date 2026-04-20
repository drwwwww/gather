-- Allow users to mark their own notification rows as read (e.g. mobile / member apps).
create policy "notifications_self_update" on public.notification_log
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
