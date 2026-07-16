-- 0011_admin_auth_maintenance.sql
-- Keep user maintenance independent from Supabase Auth Admin endpoints. The
-- hosted Auth API in this project can return "Database error loading user" for
-- admin update/delete/list operations, so trusted server code uses these
-- service-role-only helpers instead.

create or replace function public.admin_list_app_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  phone text,
  username text
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    p.id,
    u.email,
    coalesce(nullif(p.full_name, ''), u.raw_user_meta_data->>'full_name', '') as full_name,
    coalesce(p.role, u.raw_app_meta_data->>'role', 'customer') as role,
    p.phone,
    p.username
  from public.profiles p
  left join auth.users u on u.id = p.id
  where coalesce(p.role, u.raw_app_meta_data->>'role', 'customer') in ('admin', 'employee', 'customer')
  order by
    case coalesce(p.role, u.raw_app_meta_data->>'role', 'customer')
      when 'admin' then 0
      when 'employee' then 1
      else 2
    end,
    coalesce(nullif(p.full_name, ''), u.raw_user_meta_data->>'full_name', '');
$$;

create or replace function public.admin_set_user_role(
  p_user uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  clean_role text := lower(trim(coalesce(p_role, '')));
  meta_name text;
begin
  if clean_role not in ('admin', 'employee', 'customer') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  update auth.users
  set
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', clean_role),
    updated_at = now()
  where id = p_user
  returning raw_user_meta_data->>'full_name' into meta_name;

  if not found then
    raise exception 'auth_user_not_found' using errcode = 'P0002';
  end if;

  insert into public.profiles (id, role, full_name)
  values (p_user, clean_role, coalesce(meta_name, ''))
  on conflict (id) do update
  set role = excluded.role;
end;
$$;

create or replace function public.admin_update_customer_auth_user(
  p_user uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_birth_date date default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  clean_email text := lower(trim(coalesce(p_email, '')));
  clean_full_name text := trim(coalesce(p_full_name, ''));
  clean_phone text := nullif(trim(coalesce(p_phone, '')), '');
begin
  if clean_email = '' or clean_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if clean_full_name = '' then
    raise exception 'full_name_required' using errcode = '22023';
  end if;

  if exists (
    select 1 from auth.users
    where lower(email) = clean_email
      and id <> p_user
  ) then
    raise exception 'auth_user_email_exists' using errcode = '23505';
  end if;

  if clean_phone is not null and exists (
    select 1 from public.profiles
    where phone = clean_phone
      and id <> p_user
  ) then
    raise exception 'profile_phone_exists' using errcode = '23505';
  end if;

  update auth.users
  set
    email = clean_email,
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', 'customer'
      ),
    raw_user_meta_data = jsonb_strip_nulls(
      coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'full_name', clean_full_name,
        'phone', clean_phone,
        'birth_date', p_birth_date
      )
    ),
    updated_at = now()
  where id = p_user;

  if not found then
    raise exception 'auth_user_not_found' using errcode = 'P0002';
  end if;

  update auth.identities
  set
    identity_data = jsonb_strip_nulls(
      coalesce(identity_data, '{}'::jsonb)
      || jsonb_build_object(
        'sub', p_user::text,
        'email', clean_email,
        'email_verified', true,
        'phone_verified', false
      )
    ),
    updated_at = now()
  where user_id = p_user
    and provider = 'email';

  update public.profiles
  set
    role = 'customer',
    full_name = clean_full_name,
    phone = clean_phone,
    birth_date = p_birth_date
  where id = p_user;

  if not found then
    insert into public.profiles (id, role, full_name, phone, birth_date)
    values (p_user, 'customer', clean_full_name, clean_phone, p_birth_date);
  end if;

  perform public.ensure_loyalty_account(p_user);
end;
$$;

create or replace function public.admin_delete_auth_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  delete from auth.users
  where id = p_user;

  -- The profile normally cascades from auth.users. This extra delete also
  -- cleans up older orphan profile rows if Auth had already lost the user.
  delete from public.profiles
  where id = p_user;
end;
$$;

revoke all on function public.admin_list_app_users() from public, anon, authenticated;
revoke all on function public.admin_set_user_role(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_update_customer_auth_user(uuid, text, text, text, date) from public, anon, authenticated;
revoke all on function public.admin_delete_auth_user(uuid) from public, anon, authenticated;

grant execute on function public.admin_list_app_users() to service_role;
grant execute on function public.admin_set_user_role(uuid, text) to service_role;
grant execute on function public.admin_update_customer_auth_user(uuid, text, text, text, date) to service_role;
grant execute on function public.admin_delete_auth_user(uuid) to service_role;
