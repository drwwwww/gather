-- Removing a service time (Account → Service times) cascaded and DELETED every
-- service plan for that time — past and future, with all roles, run-of-show
-- parts, answers and check-ins. Plans carry their own start_time since 0027,
-- so they don't need the service time to exist: keep them and just unlink.
-- Presets also keep working via worship_day (0028).

alter table public.service_plans drop constraint if exists service_plans_service_time_id_fkey;
alter table public.service_plans
  add constraint service_plans_service_time_id_fkey
  foreign key (service_time_id) references public.service_times(id) on delete set null;

alter table public.service_presets drop constraint if exists service_presets_service_time_id_fkey;
alter table public.service_presets
  add constraint service_presets_service_time_id_fkey
  foreign key (service_time_id) references public.service_times(id) on delete set null;

-- Plans unlinked from a time should still say when they start.
update public.service_plans p
   set start_time = to_char(t.start_time, 'HH24:MI')
  from public.service_times t
 where p.service_time_id = t.id and p.start_time is null;
