-- Make auth.users.raw_app_meta_data the trusted source of application roles.
-- Repair existing users once, then ensure new profile rows only consume roles
-- written by trusted server-side code.

update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', p.role)
from public.profiles p
where p.id = u.id
  and p.role in ('admin', 'employee', 'customer');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  trusted_role text;
begin
  trusted_role := new.raw_app_meta_data->>'role';
  if trusted_role not in ('admin', 'employee', 'customer') then
    trusted_role := 'customer';
  end if;

  insert into public.profiles (id, role, full_name, phone, username)
  values (
    new.id,
    trusted_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- If a role is changed directly in profiles by trusted admin code, keep the
-- next JWT refresh consistent with RLS. Ordinary users cannot update profiles.
create or replace function public.sync_profile_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', new.role)
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_role_changed on public.profiles;
create trigger on_profile_role_changed
  after update of role on public.profiles
  for each row execute function public.sync_profile_role_to_auth();
