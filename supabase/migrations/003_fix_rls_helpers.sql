-- Fix RLS recursion by running helper functions with row security disabled
create or replace function public.current_user_role()
returns role_enum
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_church_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select church_id from public.profiles where id = auth.uid();
$$;
