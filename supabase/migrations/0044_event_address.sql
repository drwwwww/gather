-- Events get their own street address. `location` stays the venue/room
-- ("Fellowship Hall"); `address` is where to drive. When null, apps fall back
-- to the church's address, so every event shows somewhere to go.
alter table public.events add column if not exists address text;
