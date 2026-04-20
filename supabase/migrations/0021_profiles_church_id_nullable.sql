-- Allow profiles with no church (removed from congregation; can re-join via mobile join flow).
-- null church_id = user is not associated with any church.
alter table public.profiles
  alter column church_id drop not null;

comment on column public.profiles.church_id is 'Church the user belongs to; null if not in any church (e.g. removed by admin).';
