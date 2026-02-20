-- Allow unauthenticated and onboarding users to select all churches for onboarding
create policy "church_select_onboarding" on public.churches
for select
using (true);