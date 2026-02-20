-- Add timezone to churches and update bootstrap to capture it
alter table public.churches
  add column if not exists timezone text not null default 'America/New_York';

drop function if exists public.bootstrap_church(text, text);
create or replace function public.bootstrap_church(p_name text, p_slug text, p_timezone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_church_id uuid;
  v_email text;
  v_full_name text;
begin
  select email, raw_user_meta_data->>'full_name' into v_email, v_full_name
  from auth.users where id = auth.uid();

  insert into public.churches (name, slug, timezone)
  values (p_name, p_slug, p_timezone)
  returning id into v_church_id;

  insert into public.profiles (id, church_id, full_name, email, role)
  values (auth.uid(), v_church_id, v_full_name, v_email, 'ADMIN')
  on conflict (id) do update
    set church_id = excluded.church_id,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = coalesce(excluded.email, public.profiles.email),
        role = 'ADMIN';

  return v_church_id;
end;
$$;

grant execute on function public.bootstrap_church(text, text, text) to authenticated;
