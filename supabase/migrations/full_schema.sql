-- =============================================================================
-- FULL SCHEMA — paste into the NEW Supabase project's SQL Editor and run once.
-- Built from migrations 0001 + 0002 + 0003 + 0004 + 0005 (idempotent).
-- =============================================================================

-- >>> 0001_init.sql >>>
-- =============================================================================
-- Coffee Subscription App — schema, indexes, RLS, and admin-only analytics RPCs
-- Timezone for all "today" math: Asia/Muscat. Currency: OMR (3 decimals).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- One row per auth user. role drives all access control.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin','employee','customer')),
  full_name  text not null default '',
  phone      text,        -- customers log in by phone
  username   text,        -- staff (admin/employee) log in by username
  created_at timestamptz not null default now()
);

create table if not exists public.packages (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  duration_days   int  not null check (duration_days > 0),
  daily_allowance int  not null check (daily_allowance > 0),
  price           numeric(8,3) not null default 0,   -- OMR
  created_at      timestamptz not null default now()
);

-- A customer's purchase of a package. duration_days is snapshotted at purchase
-- so later edits to the package do not retroactively change days_left.
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.profiles(id) on delete cascade,
  package_id    uuid not null references public.packages(id) on delete restrict,
  start_date    date not null default ((now() at time zone 'Asia/Muscat')::date),
  duration_days int  not null check (duration_days > 0),
  created_at    timestamptz not null default now()
);

-- One row per cup redeemed. day is the Asia/Muscat calendar day (for the
-- per-package daily allowance check).
create table if not exists public.redemptions (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  customer_id     uuid not null references public.profiles(id) on delete cascade,
  day             date not null default ((now() at time zone 'Asia/Muscat')::date),
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INDEXES (required by spec + login lookups)
-- ----------------------------------------------------------------------------
create index if not exists idx_redemptions_subscription_id on public.redemptions(subscription_id);
create index if not exists idx_redemptions_customer_id     on public.redemptions(customer_id);
create index if not exists idx_redemptions_day             on public.redemptions(day);
create index if not exists idx_subscriptions_customer_id   on public.subscriptions(customer_id);
create index if not exists idx_subscriptions_package_id    on public.subscriptions(package_id);
create index if not exists idx_profiles_role               on public.profiles(role);
create unique index if not exists uq_profiles_phone        on public.profiles(phone)    where phone is not null;
create unique index if not exists uq_profiles_username     on public.profiles(username) where username is not null;

-- ----------------------------------------------------------------------------
-- HELPER: is the current caller an admin? (used by RLS + RPC guards)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin','employee')
  );
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Dashboard aggregates are ONLY reachable via the admin-gated RPCs below.
-- RLS additionally guarantees a non-admin cannot read other users' rows and
-- therefore cannot reconstruct the aggregates client-side.
-- ----------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.packages      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.redemptions   enable row level security;

-- profiles ---------------------------------------------------------------
create policy "profiles self read"  on public.profiles
  for select using (id = auth.uid());
create policy "profiles admin read" on public.profiles
  for select using (public.is_admin());
-- employees may look up customers (scan-by-phone flow)
create policy "profiles staff read customers" on public.profiles
  for select using (public.is_staff() and role = 'customer');
create policy "profiles admin write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- packages ---------------------------------------------------------------
create policy "packages read"  on public.packages
  for select using (auth.uid() is not null);
create policy "packages admin write" on public.packages
  for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions ----------------------------------------------------------
create policy "subscriptions own read" on public.subscriptions
  for select using (customer_id = auth.uid());
create policy "subscriptions staff read" on public.subscriptions
  for select using (public.is_staff());
create policy "subscriptions admin write" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- redemptions ------------------------------------------------------------
create policy "redemptions own read" on public.redemptions
  for select using (customer_id = auth.uid());
create policy "redemptions staff read" on public.redemptions
  for select using (public.is_staff());
-- staff (cashier/admin) record a redemption at scan time
create policy "redemptions staff insert" on public.redemptions
  for insert with check (public.is_staff());
create policy "redemptions admin write" on public.redemptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- ADMIN-ONLY ANALYTICS RPCs
-- All are SECURITY DEFINER and reject any caller whose profile role <> 'admin'.
-- Aggregation happens entirely in SQL (GROUP BY) — never row-by-row on client.
-- ============================================================================

-- 1) Overview KPIs ----------------------------------------------------------
create or replace function public.admin_overview_kpis()
returns table (
  total_subscribers              int,
  active_subscribers             int,
  expired_subscribers            int,
  total_redemptions              int,
  avg_redemptions_per_subscriber numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with current_sub as (
    -- the latest subscription per customer = their "current" subscription
    select distinct on (s.customer_id)
           s.id,
           s.customer_id,
           (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) as days_left
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  ),
  agg as (
    select
      count(*)::int                                  as total_subscribers,
      count(*) filter (where days_left > 0)::int     as active_subscribers
    from current_sub
  ),
  reds as ( select count(*)::int as total_redemptions from public.redemptions )
  select
    agg.total_subscribers,
    agg.active_subscribers,
    (agg.total_subscribers - agg.active_subscribers)::int as expired_subscribers,
    reds.total_redemptions,
    round(reds.total_redemptions::numeric / nullif(agg.total_subscribers, 0), 1) as avg_redemptions_per_subscriber
  from agg, reds;
end;
$$;

-- 2) By subscription type (one row per package) -----------------------------
create or replace function public.admin_subscriptions_by_package()
returns table (
  package_id        uuid,
  package_name      text,
  subscribers_count int,
  redemptions_count int
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with current_sub as (
    select distinct on (s.customer_id)
           s.id, s.customer_id, s.package_id
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  )
  select
    p.id,
    p.name,
    count(distinct cs.customer_id)::int                                   as subscribers_count,
    count(r.id)::int                                                      as redemptions_count
  from public.packages p
  left join current_sub cs on cs.package_id = p.id
  left join public.redemptions r on r.subscription_id = cs.id
  group by p.id, p.name
  order by subscribers_count desc, p.name;
end;
$$;

-- 3) Per-customer detail (one row per customer's current subscription) ------
create or replace function public.admin_customer_detail(search text default null)
returns table (
  customer_id  uuid,
  full_name    text,
  phone        text,
  package_name text,
  status       text,
  days_left    int,
  times_used   int
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with current_sub as (
    select distinct on (s.customer_id)
           s.id, s.customer_id, s.package_id,
           (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) as days_left
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  )
  select
    pr.id,
    pr.full_name,
    pr.phone,
    pk.name,
    case when cs.days_left > 0 then 'active' else 'expired' end as status,
    cs.days_left::int,
    count(r.id)::int as times_used
  from current_sub cs
  join public.profiles pr on pr.id = cs.customer_id
  left join public.packages pk on pk.id = cs.package_id
  left join public.redemptions r on r.subscription_id = cs.id
  where search is null
     or search = ''
     or pr.full_name ilike '%' || search || '%'
     or coalesce(pr.phone, '') ilike '%' || search || '%'
  group by pr.id, pr.full_name, pr.phone, pk.name, cs.days_left
  order by times_used desc, pr.full_name;
end;
$$;

-- 4) (Optional) total redemptions per day, last 30 Asia/Muscat days ---------
create or replace function public.admin_redemptions_last_30_days()
returns table ( day date, count int )
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with days as (
    select generate_series(
      ((now() at time zone 'Asia/Muscat')::date - 29),
      ((now() at time zone 'Asia/Muscat')::date),
      interval '1 day'
    )::date as day
  )
  select d.day, count(r.id)::int
  from days d
  left join public.redemptions r on r.day = d.day
  group by d.day
  order by d.day;
end;
$$;

-- ----------------------------------------------------------------------------
-- GRANTS: only authenticated may execute; the body itself enforces admin-only.
-- anon/public get nothing.
-- ----------------------------------------------------------------------------
revoke all on function public.admin_overview_kpis()             from public, anon;
revoke all on function public.admin_subscriptions_by_package()  from public, anon;
revoke all on function public.admin_customer_detail(text)       from public, anon;
revoke all on function public.admin_redemptions_last_30_days()  from public, anon;

grant execute on function public.admin_overview_kpis()            to authenticated;
grant execute on function public.admin_subscriptions_by_package() to authenticated;
grant execute on function public.admin_customer_detail(text)      to authenticated;
grant execute on function public.admin_redemptions_last_30_days() to authenticated;

-- ----------------------------------------------------------------------------
-- AUTO-CREATE a profile row when an auth user is created. Role/details come
-- from the user's metadata (set by the server-side admin create flow).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, role, full_name, phone, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- >>> 0002_nfc.sql >>>
-- =============================================================================
-- Add NFC card linkage to subscriptions.
-- Each subscription can be linked to a physical NFC card number, scanned/typed
-- at the till to find the active subscription.
-- =============================================================================

alter table public.subscriptions
  add column if not exists nfc_card_id text;

-- Look up a subscription quickly by its NFC card at scan time.
create index if not exists idx_subscriptions_nfc_card_id
  on public.subscriptions(nfc_card_id) where nfc_card_id is not null;

-- >>> 0003_customer_rpc.sql >>>
-- Customer-facing RPC: returns the caller's latest subscription with days_left
-- calculated server-side using Asia/Muscat timezone (no JS date math).

create or replace function public.get_my_subscription()
returns table (
  id              uuid,
  package_id      uuid,
  package_name    text,
  duration_days   int,
  daily_allowance int,
  start_date      date,
  days_left       int,
  status          text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select
    s.id,
    s.package_id,
    pk.name                                                                      as package_name,
    s.duration_days,
    pk.daily_allowance,
    s.start_date,
    (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date))::int as days_left,
    case
      when (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) > 0
      then 'active'
      else 'expired'
    end                                                                          as status
  from public.subscriptions s
  join public.packages pk on pk.id = s.package_id
  where s.customer_id = auth.uid()
  order by s.start_date desc, s.created_at desc
  limit 1;
end;
$$;

-- Grant to authenticated users (each user can only see their own row via auth.uid())
grant execute on function public.get_my_subscription() to authenticated;

-- >>> 0004_d7_design.sql >>>
-- =============================================================================
-- District 7 redesign additions: package tier, monthly revenue KPI, weekly
-- chart RPC, and `tier` surfaced on the customer + admin read RPCs.
-- Functions with changed OUT columns are dropped + recreated, then re-granted.
-- =============================================================================

alter table public.packages
  add column if not exists tier text check (tier in ('gold','silver','bronze'));

drop function if exists public.admin_overview_kpis();
create function public.admin_overview_kpis()
returns table (
  total_subscribers              int,
  active_subscribers             int,
  expired_subscribers            int,
  total_redemptions              int,
  avg_redemptions_per_subscriber numeric,
  total_revenue                  numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with current_sub as (
    select distinct on (s.customer_id)
           s.id, s.customer_id, s.package_id,
           (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) as days_left
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  ),
  agg as (
    select
      count(*)::int                              as total_subscribers,
      count(*) filter (where days_left > 0)::int as active_subscribers,
      coalesce(sum(pk.price), 0)::numeric        as total_revenue
    from current_sub cs
    left join public.packages pk on pk.id = cs.package_id
  ),
  reds as ( select count(*)::int as total_redemptions from public.redemptions )
  select
    agg.total_subscribers,
    agg.active_subscribers,
    (agg.total_subscribers - agg.active_subscribers)::int,
    reds.total_redemptions,
    round(reds.total_redemptions::numeric / nullif(agg.total_subscribers, 0), 1),
    round(agg.total_revenue, 3)
  from agg, reds;
end;
$$;
revoke all on function public.admin_overview_kpis() from public, anon;
grant execute on function public.admin_overview_kpis() to authenticated;

drop function if exists public.admin_subscriptions_by_package();
create function public.admin_subscriptions_by_package()
returns table (
  package_id uuid, package_name text, tier text,
  subscribers_count int, redemptions_count int
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with current_sub as (
    select distinct on (s.customer_id) s.id, s.customer_id, s.package_id
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  )
  select p.id, p.name, p.tier,
         count(distinct cs.customer_id)::int, count(r.id)::int
  from public.packages p
  left join current_sub cs on cs.package_id = p.id
  left join public.redemptions r on r.subscription_id = cs.id
  group by p.id, p.name, p.tier
  order by subscribers_count desc, p.name;
end;
$$;
revoke all on function public.admin_subscriptions_by_package() from public, anon;
grant execute on function public.admin_subscriptions_by_package() to authenticated;

drop function if exists public.admin_customer_detail(text);
create function public.admin_customer_detail(search text default null)
returns table (
  customer_id uuid, full_name text, phone text, package_name text, tier text,
  status text, days_left int, times_used int
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with current_sub as (
    select distinct on (s.customer_id) s.id, s.customer_id, s.package_id,
           (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) as days_left
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  )
  select pr.id, pr.full_name, pr.phone, pk.name, pk.tier,
         case when cs.days_left > 0 then 'active' else 'expired' end,
         cs.days_left::int, count(r.id)::int
  from current_sub cs
  join public.profiles pr on pr.id = cs.customer_id
  left join public.packages pk on pk.id = cs.package_id
  left join public.redemptions r on r.subscription_id = cs.id
  where search is null or search = ''
     or pr.full_name ilike '%' || search || '%'
     or coalesce(pr.phone, '') ilike '%' || search || '%'
  group by pr.id, pr.full_name, pr.phone, pk.name, pk.tier, cs.days_left
  order by times_used desc, pr.full_name;
end;
$$;
revoke all on function public.admin_customer_detail(text) from public, anon;
grant execute on function public.admin_customer_detail(text) to authenticated;

drop function if exists public.admin_redemptions_last_7_days();
create function public.admin_redemptions_last_7_days()
returns table ( day date, count int )
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with days as (
    select generate_series(
      ((now() at time zone 'Asia/Muscat')::date - 6),
      ((now() at time zone 'Asia/Muscat')::date),
      interval '1 day')::date as day
  )
  select d.day, count(r.id)::int
  from days d
  left join public.redemptions r on r.day = d.day
  group by d.day order by d.day;
end;
$$;
revoke all on function public.admin_redemptions_last_7_days() from public, anon;
grant execute on function public.admin_redemptions_last_7_days() to authenticated;

drop function if exists public.get_my_subscription();
create function public.get_my_subscription()
returns table (
  id uuid, package_id uuid, package_name text, tier text,
  duration_days int, daily_allowance int, start_date date, days_left int, status text
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  return query
  select s.id, s.package_id, pk.name, pk.tier, s.duration_days, pk.daily_allowance, s.start_date,
    (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date))::int,
    case when (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) > 0
         then 'active' else 'expired' end
  from public.subscriptions s
  join public.packages pk on pk.id = s.package_id
  where s.customer_id = auth.uid()
  order by s.start_date desc, s.created_at desc
  limit 1;
end;
$$;
grant execute on function public.get_my_subscription() to authenticated;

-- >>> 0005_cards.sql >>>
-- =============================================================================
-- 0005_cards.sql — Dedicated NFC card registry.
-- A card belongs to a CUSTOMER (not a subscription) so it survives renewals.
-- Managed from Admin → Cards; scanned at the till to find the customer's
-- current subscription. Replaces writes to subscriptions.nfc_card_id (column
-- is kept for rollback; reads/writes move to public.cards).
-- =============================================================================

create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  card_uid    text not null,
  customer_id uuid references public.profiles(id) on delete set null,
  status      text not null default 'unassigned'
              check (status in ('active','unassigned','lost','blocked')),
  label       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One physical card = one row; scan-time lookup key.
create unique index if not exists uq_cards_card_uid on public.cards(card_uid);
create index if not exists idx_cards_customer_id    on public.cards(customer_id);

-- ----------------------------------------------------------------------------
-- BACKFILL from subscriptions.nfc_card_id — latest subscription wins per card.
-- ----------------------------------------------------------------------------
insert into public.cards (card_uid, customer_id, status)
select distinct on (trim(s.nfc_card_id))
       trim(s.nfc_card_id), s.customer_id, 'active'
from public.subscriptions s
where s.nfc_card_id is not null and trim(s.nfc_card_id) <> ''
order by trim(s.nfc_card_id), s.start_date desc, s.created_at desc
on conflict (card_uid) do nothing;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.cards enable row level security;

-- Customers may see their own card(s).
drop policy if exists "cards own read" on public.cards;
create policy "cards own read" on public.cards
  for select using (customer_id = auth.uid());

-- Staff look up any card at scan time.
drop policy if exists "cards staff read" on public.cards;
create policy "cards staff read" on public.cards
  for select using (public.is_staff());

-- Only admin manages cards.
drop policy if exists "cards admin write" on public.cards;
create policy "cards admin write" on public.cards
  for all using (public.is_admin()) with check (public.is_admin());
