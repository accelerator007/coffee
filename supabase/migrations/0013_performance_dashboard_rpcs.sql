-- 0013_performance_dashboard_rpcs.sql
-- Reduce page latency by moving repeated dashboard reads into single database
-- round trips, and add indexes for the hot paths used by login dashboards.

create index if not exists idx_subscriptions_customer_latest
  on public.subscriptions(customer_id, start_date desc, created_at desc);

create index if not exists idx_redemptions_subscription_day
  on public.redemptions(subscription_id, day);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_offer_claims_offer_customer
  on public.offer_claims(offer_id, customer_id);

create index if not exists idx_loyalty_transactions_customer_created
  on public.loyalty_transactions(customer_id, created_at desc);

drop function if exists public.get_customer_dashboard();
create function public.get_customer_dashboard()
returns table (
  subscription jsonb,
  loyalty jsonb,
  offers jsonb,
  notifications jsonb,
  today_used int
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  current_sub jsonb;
  current_sub_id uuid;
  loyalty_summary jsonb;
  active_offers jsonb;
  recent_notifications jsonb;
  used_today int := 0;
  today date := ((now() at time zone 'Asia/Muscat')::date);
begin
  if uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = uid and role = 'customer') then
    return;
  end if;

  select to_jsonb(s), s.id
  into current_sub, current_sub_id
  from public.get_my_subscription() s
  limit 1;

  select to_jsonb(l)
  into loyalty_summary
  from public.get_my_loyalty_summary() l
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(o) order by o.ends_at nulls last, o.title_ar), '[]'::jsonb)
  into active_offers
  from public.get_active_offers() o;

  select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc), '[]'::jsonb)
  into recent_notifications
  from (
    select id, title_ar, title_en, body_ar, body_en, kind, read_at, created_at
    from public.notifications
    where user_id = uid
    order by created_at desc
    limit 5
  ) n;

  if current_sub_id is not null then
    select count(*)::int
    into used_today
    from public.redemptions
    where subscription_id = current_sub_id
      and day = today;
  end if;

  return query
  select current_sub, loyalty_summary, active_offers, recent_notifications, used_today;
end;
$$;

revoke all on function public.get_customer_dashboard() from public, anon;
grant execute on function public.get_customer_dashboard() to authenticated;

drop function if exists public.admin_dashboard_summary();
create function public.admin_dashboard_summary()
returns table (
  kpis jsonb,
  by_package jsonb,
  trend jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  overview jsonb;
  packages jsonb;
  redemptions jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select to_jsonb(k)
  into overview
  from public.admin_overview_kpis() k
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.subscribers_count desc, p.package_name), '[]'::jsonb)
  into packages
  from public.admin_subscriptions_by_package() p;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.day), '[]'::jsonb)
  into redemptions
  from public.admin_redemptions_last_7_days() t;

  return query select overview, packages, redemptions;
end;
$$;

revoke all on function public.admin_dashboard_summary() from public, anon;
grant execute on function public.admin_dashboard_summary() to authenticated;

drop function if exists public.admin_loyalty_dashboard();
create function public.admin_loyalty_dashboard()
returns table (
  settings jsonb,
  tiers jsonb,
  offers jsonb,
  double_days jsonb,
  customers jsonb,
  transactions jsonb,
  kpis jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  loyalty_settings jsonb;
  tier_rows jsonb;
  offer_rows jsonb;
  double_day_rows jsonb;
  customer_rows jsonb;
  transaction_rows jsonb;
  loyalty_kpis jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select to_jsonb(ls)
  into loyalty_settings
  from (
    select points_per_redemption, referred_customer_points
    from public.loyalty_settings
    where id = true
  ) ls;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.sort_order), '[]'::jsonb)
  into tier_rows
  from (
    select slug, name_ar, name_en, min_points, points_multiplier, birthday_points, referral_points, is_active, sort_order
    from public.loyalty_tiers
    order by sort_order
  ) t;

  select coalesce(jsonb_agg(to_jsonb(o) order by o.sort_order, o.created_at desc), '[]'::jsonb)
  into offer_rows
  from (
    select id, title_ar, title_en, body_ar, body_en, badge_ar, badge_en,
           starts_at, ends_at, is_active, target_tier, points_cost,
           reward_points, sort_order, created_at
    from public.offers
    order by sort_order, created_at desc
  ) o;

  select coalesce(jsonb_agg(to_jsonb(d) order by d.day desc), '[]'::jsonb)
  into double_day_rows
  from (
    select id, title_ar, title_en, day, multiplier, is_active
    from public.double_point_days
    order by day desc
  ) d;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.full_name), '[]'::jsonb)
  into customer_rows
  from (
    select
      p.id,
      p.full_name,
      p.phone,
      jsonb_build_object(
        'points_balance', coalesce(la.points_balance, 0),
        'lifetime_points', coalesce(la.lifetime_points, 0),
        'referral_code', la.referral_code
      ) as loyalty_accounts
    from public.profiles p
    left join public.loyalty_accounts la on la.customer_id = p.id
    where p.role = 'customer'
    order by p.full_name
  ) c;

  select coalesce(jsonb_agg(to_jsonb(tx) order by tx.created_at desc), '[]'::jsonb)
  into transaction_rows
  from (
    select
      lt.id,
      lt.points,
      lt.type,
      lt.description,
      lt.created_at,
      jsonb_build_object('full_name', p.full_name) as profiles
    from public.loyalty_transactions lt
    left join public.profiles p on p.id = lt.customer_id
    order by lt.created_at desc
    limit 20
  ) tx;

  select to_jsonb(k)
  into loyalty_kpis
  from public.admin_loyalty_kpis() k
  limit 1;

  return query
  select
    coalesce(loyalty_settings, '{"points_per_redemption":10,"referred_customer_points":50}'::jsonb),
    tier_rows,
    offer_rows,
    double_day_rows,
    customer_rows,
    transaction_rows,
    loyalty_kpis;
end;
$$;

revoke all on function public.admin_loyalty_dashboard() from public, anon;
grant execute on function public.admin_loyalty_dashboard() to authenticated;

drop function if exists public.admin_customer_search(text);
create function public.admin_customer_search(search text default null)
returns table (
  id uuid,
  full_name text,
  phone text,
  birth_date date,
  points_balance int,
  lifetime_points int,
  referral_code text,
  package_name text,
  tier text,
  status text,
  days_left int,
  times_used int
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
  with customers as (
    select
      p.id,
      p.full_name,
      p.phone,
      p.birth_date,
      p.created_at,
      coalesce(la.points_balance, 0)::int as points_balance,
      coalesce(la.lifetime_points, 0)::int as lifetime_points,
      la.referral_code
    from public.profiles p
    left join public.loyalty_accounts la on la.customer_id = p.id
    where p.role = 'customer'
      and (
        search is null
        or search = ''
        or p.full_name ilike '%' || search || '%'
        or coalesce(p.phone, '') ilike '%' || search || '%'
      )
  ),
  current_sub as (
    select distinct on (s.customer_id)
      s.id,
      s.customer_id,
      s.package_id,
      (s.duration_days - ((now() at time zone 'Asia/Muscat')::date - s.start_date))::int as days_left
    from public.subscriptions s
    order by s.customer_id, s.start_date desc, s.created_at desc
  )
  select
    c.id,
    c.full_name,
    c.phone,
    c.birth_date,
    c.points_balance,
    c.lifetime_points,
    c.referral_code,
    pk.name as package_name,
    pk.tier,
    case
      when cs.id is null then null
      when cs.days_left > 0 then 'active'
      else 'expired'
    end as status,
    cs.days_left,
    coalesce(count(r.id), 0)::int as times_used
  from customers c
  left join current_sub cs on cs.customer_id = c.id
  left join public.packages pk on pk.id = cs.package_id
  left join public.redemptions r on r.subscription_id = cs.id
  group by
    c.id, c.full_name, c.phone, c.birth_date, c.points_balance,
    c.lifetime_points, c.referral_code, c.created_at,
    cs.id, cs.days_left, pk.name, pk.tier
  order by c.created_at desc;
end;
$$;

revoke all on function public.admin_customer_search(text) from public, anon;
grant execute on function public.admin_customer_search(text) to authenticated;
