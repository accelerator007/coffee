-- 0012_auth_valid_internal_email_domains.sql
-- Move synthetic Auth emails away from ".local" domains. They are fine for
-- display, but Supabase Auth sign-in can reject or fail to resolve them through
-- the email/password endpoint. Keep all generated addresses RFC/Auth-friendly.

update auth.users
set
  email = regexp_replace(email, '@internal\.local$', '@staff.district7.app'),
  updated_at = now()
where email ~ '@internal\.local$';

update auth.users
set
  email = regexp_replace(email, '^\+?([0-9]+)@phone\.local$', '\1@phone.district7.app'),
  updated_at = now()
where email ~ '^\+?[0-9]+@phone\.local$'
  and not exists (
    select 1
    from auth.users existing
    where existing.id <> auth.users.id
      and existing.email = regexp_replace(auth.users.email, '^\+?([0-9]+)@phone\.local$', '\1@phone.district7.app')
  );

update auth.identities i
set
  identity_data = jsonb_strip_nulls(
    coalesce(i.identity_data, '{}'::jsonb)
    || jsonb_build_object(
      'email', u.email,
      'email_verified', true,
      'phone_verified', false
    )
  ),
  updated_at = now()
from auth.users u
where i.user_id = u.id
  and i.provider = 'email'
  and i.identity_data->>'email' is distinct from u.email;

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  updated_at = now()
where confirmation_token is null
   or recovery_token is null
   or email_change is null
   or email_change_token_new is null;

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
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new
  )
  values (
    default_instance_id,
    new_user_id,
    'authenticated',
    'authenticated',
    clean_email,
    crypt(p_password, gen_salt('bf', 12)),
    now(),
    now(),
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
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
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
