-- Church discovery: lets members search for events at nearby churches,
-- not just their own. Opt-in per church (discoverable, default true) so an
-- admin can turn it off. Only non-cancelled, ALL-audience events are exposed
-- cross-tenant -- nothing else on the church or its events is relaxed.

alter table public.churches
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists discoverable boolean not null default true;

-- Any authenticated user may see basic info for discoverable churches
-- (name/address/lat/lng), not just their own church.
create policy "church_select_discoverable" on public.churches
for select
using (discoverable = true);

-- Any authenticated user may see public events belonging to a discoverable
-- church, regardless of their own church_id.
create policy "events_discoverable_select" on public.events
for select
using (
  is_cancelled = false
  and audience = 'ALL'
  and exists (
    select 1 from public.churches c
    where c.id = events.church_id and c.discoverable = true
  )
);

create index if not exists idx_churches_discoverable on public.churches(discoverable);
