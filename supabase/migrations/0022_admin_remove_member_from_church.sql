-- Remove-from-church was blocked for some admins under profiles RLS (WITH CHECK / helper evaluation).
-- Use a locked-down SECURITY DEFINER RPC so only same-church admins can clear another member's church_id.

create or replace function public.admin_remove_member_from_church(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_admin_church uuid;
  v_admin_role public.role_enum;
  v_target_church uuid;
  v_target_role public.role_enum;
  v_admin_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select church_id, role into v_admin_church, v_admin_role
  from public.profiles
  where id = auth.uid();

  if v_admin_role is distinct from 'ADMIN'::public.role_enum then
    raise exception 'Forbidden: administrators only';
  end if;

  if v_admin_church is null then
    raise exception 'Forbidden: no church on your profile';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot remove yourself from the church';
  end if;

  select church_id, role into v_target_church, v_target_role
  from public.profiles
  where id = p_user_id;

  if not found then
    raise exception 'Member not found';
  end if;

  if v_target_church is distinct from v_admin_church then
    raise exception 'Forbidden: member is not in your church';
  end if;

  if v_target_role = 'ADMIN'::public.role_enum then
    select count(*)::int into v_admin_count
    from public.profiles
    where church_id = v_admin_church
      and role = 'ADMIN'::public.role_enum
      and coalesce(disabled, false) = false;

    if v_admin_count <= 1 then
      raise exception 'Cannot remove the last administrator from the church';
    end if;
  end if;

  update public.profiles
  set church_id = null
  where id = p_user_id
    and church_id = v_admin_church;
end;
$$;

grant execute on function public.admin_remove_member_from_church(uuid) to authenticated;

comment on function public.admin_remove_member_from_church(uuid) is
  'Admin clears another user''s church_id (remove from congregation). Enforces same church, not self, not last active admin.';
