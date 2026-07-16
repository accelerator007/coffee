-- 0010_auth_instance_id_for_internal_users.sql
-- Supabase Auth APIs scope users by instance_id. Keep internally-created users
-- visible to Auth Admin/update/sign-in by setting the hosted default instance id.

create or replace function public.admin_create_internal_auth_user(
  p_email text,
  p_password text,
  p_role text,
  p_full_name text,
  p_phone text default null,
  p_username text default null,
  p_birth_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  new_user_id uuid := gen_random_uuid();
  default_instance_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  clean_role text := lower(trim(coalesce(p_role, 'customer')));
  clean_email text := lower(trim(p_email));
  clean_full_name text := trim(coalesce(p_full_name, ''));
  clean_phone text := nullif(trim(coalesce(p_phone, '')), '');
  clean_username text := nullif(lower(trim(coalesce(p_username, ''))), '');
begin
  if clean_role not in ('admin', 'employee', 'customer') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  if clean_email = '' or clean_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if length(coalesce(p_password, '')) < 4 then
    raise exception 'password_too_short' using errcode = '22023';
  end if;

  if clean_full_name = '' then
    raise exception 'full_name_required' using errcode = '22023';
  end if;

  if exists (select 1 from auth.users where email = clean_email) then
    raise exception 'user_email_exists' using errcode = '23505';
  end if;

  if clean_phone is not null and exists (select 1 from public.profiles where phone = clean_phone) then
    raise exception 'user_phone_exists' using errcode = '23505';
  end if;

  if clean_username is not null and exists (select 1 from public.profiles where username = clean_username) then
    raise exception 'user_username_exists' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    default_instance_id,
    new_user_id,
    'authenticated',
    'authenticated',
    clean_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', clean_role
    ),
    jsonb_strip_nulls(jsonb_build_object(
      'full_name', clean_full_name,
      'phone', clean_phone,
      'username', clean_username,
      'birth_date', p_birth_date
    )),
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  )
  values (
    new_user_id::text,
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', clean_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now()
  );

  update public.profiles
  set birth_date = p_birth_date
  where id = new_user_id
    and p_birth_date is not null;

  perform public.ensure_loyalty_account(new_user_id);

  return new_user_id;
exception
  when unique_violation then
    raise exception 'user_already_exists' using errcode = '23505';
end;
$$;

revoke all on function public.admin_create_internal_auth_user(text, text, text, text, text, text, date) from public, anon, authenticated;
grant execute on function public.admin_create_internal_auth_user(text, text, text, text, text, text, date) to service_role;
