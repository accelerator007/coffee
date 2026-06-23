-- =============================================================================
-- 0004_d7_design.sql — additions backing the District 7 redesign.
--   * package "tier" (gold/silver/bronze) for plan badges
--   * monthly revenue added to the admin overview KPIs
--   * weekly (last 7 Asia/Muscat days) redemptions RPC for the dashboard chart
--   * surface `tier` on the customer + admin read RPCs
-- All idempotent. Functions whose OUT columns change are dropped + recreated,
-- then re-granted (Postgres cannot CREATE OR REPLACE a new return signature).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) Plan tier on packages (nullable; UI falls back to a neutral badge).
-- ----------------------------------------------------------------------------
alter table public.packages
  add column if not exists tier text check (tier in ('gold','silver','bronze'));

-- ----------------------------------------------------------------------------
-- 2) Overview KPIs — now also returns monthly revenue (sum of each customer's
--    CURRENT subscription package price). Same admin guard + Asia/Muscat math.
-- ----------------------------------------------------------------------------
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
           s.id,
           s.customer_id,
           s.package_id,
           (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) as days_left
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  ),
  agg as (
    select
      count(*)::int                                  as total_subscribers,
      count(*) filter (where days_left > 0)::int     as active_subscribers,
      coalesce(sum(pk.price), 0)::numeric            as total_revenue
    from current_sub cs
    left join public.packages pk on pk.id = cs.package_id
  ),
  reds as ( select count(*)::int as total_redemptions from public.redemptions )
  select
    agg.total_subscribers,
    agg.active_subscribers,
    (agg.total_subscribers - agg.active_subscribers)::int as expired_subscribers,
    reds.total_redemptions,
    round(reds.total_redemptions::numeric / nullif(agg.total_subscribers, 0), 1) as avg_redemptions_per_subscriber,
    round(agg.total_revenue, 3) as total_revenue
  from agg, reds;
end;
$$;

revoke all on function public.admin_overview_kpis() from public, anon;
grant execute on function public.admin_overview_kpis() to authenticated;

-- ----------------------------------------------------------------------------
-- 3) By subscription type — now returns the package tier for badges.
-- ----------------------------------------------------------------------------
drop function if exists public.admin_subscriptions_by_package();
create function public.admin_subscriptions_by_package()
returns table (
  package_id        uuid,
  package_name      text,
  tier              text,
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
    p.tier,
    count(distinct cs.customer_id)::int as subscribers_count,
    count(r.id)::int                    as redemptions_count
  from public.packages p
  left join current_sub cs on cs.package_id = p.id
  left join public.redemptions r on r.subscription_id = cs.id
  group by p.id, p.name, p.tier
  order by subscribers_count desc, p.name;
end;
$$;

revoke all on function public.admin_subscriptions_by_package() from public, anon;
grant execute on function public.admin_subscriptions_by_package() to authenticated;

-- ----------------------------------------------------------------------------
-- 4) Per-customer detail — now returns the package tier too.
-- ----------------------------------------------------------------------------
drop function if exists public.admin_customer_detail(text);
create function public.admin_customer_detail(search text default null)
returns table (
  customer_id  uuid,
  full_name    text,
  phone        text,
  package_name text,
  tier         text,
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
    pk.tier,
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
  group by pr.id, pr.full_name, pr.phone, pk.name, pk.tier, cs.days_left
  order by times_used desc, pr.full_name;
end;
$$;

revoke all on function public.admin_customer_detail(text) from public, anon;
grant execute on function public.admin_customer_detail(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5) Weekly chart — total redemptions per day for the last 7 Asia/Muscat days.
-- ----------------------------------------------------------------------------
drop function if exists public.admin_redemptions_last_7_days();
create function public.admin_redemptions_last_7_days()
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
      ((now() at time zone 'Asia/Muscat')::date - 6),
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

revoke all on function public.admin_redemptions_last_7_days() from public, anon;
grant execute on function public.admin_redemptions_last_7_days() to authenticated;

-- ----------------------------------------------------------------------------
-- 6) Customer subscription — now returns the package tier for the plan badge.
-- ----------------------------------------------------------------------------
drop function if exists public.get_my_subscription();
create function public.get_my_subscription()
returns table (
  id              uuid,
  package_id      uuid,
  package_name    text,
  tier            text,
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
    pk.name,
    pk.tier,
    s.duration_days,
    pk.daily_allowance,
    s.start_date,
    (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date))::int as days_left,
    case
      when (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date)) > 0
      then 'active'
      else 'expired'
    end as status
  from public.subscriptions s
  join public.packages pk on pk.id = s.package_id
  where s.customer_id = auth.uid()
  order by s.start_date desc, s.created_at desc
  limit 1;
end;
$$;

grant execute on function public.get_my_subscription() to authenticated;
