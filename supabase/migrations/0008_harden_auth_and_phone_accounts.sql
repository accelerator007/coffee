-- 0008_harden_auth_and_phone_accounts.sql
-- Keep Auth -> profiles creation deterministic and remove a duplicate role-sync
-- trigger found in production. Also harden loyalty account creation in Supabase
-- environments where extensions live outside the public schema.

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
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone,
    username = excluded.username;

  return new;
end;
$$;

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

drop trigger if exists sync_profile_role_to_auth on public.profiles;
drop trigger if exists on_profile_role_changed on public.profiles;
create trigger on_profile_role_changed
  after update of role on public.profiles
  for each row execute function public.sync_profile_role_to_auth();

create or replace function public.ensure_loyalty_account(p_customer uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  code text;
begin
  if not exists (
    select 1 from public.profiles where id = p_customer and role = 'customer'
  ) then
    return;
  end if;

  if exists (select 1 from public.loyalty_accounts where customer_id = p_customer) then
    return;
  end if;

  loop
    code := 'D7' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (
      select 1 from public.loyalty_accounts where referral_code = code
    );
  end loop;

  insert into public.loyalty_accounts (customer_id, referral_code)
  values (p_customer, code)
  on conflict (customer_id) do nothing;
end;
$$;

do $$
declare
  customer record;
begin
  for customer in
    select p.id
    from public.profiles p
    left join public.loyalty_accounts la on la.customer_id = p.id
    where p.role = 'customer'
      and la.customer_id is null
  loop
    perform public.ensure_loyalty_account(customer.id);
  end loop;
end;
$$;
