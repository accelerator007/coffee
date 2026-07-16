-- 0007_loyalty_rewards.sql
-- Loyalty, rewards, offers, referrals, birthday gifts, double-point days, and
-- in-app notifications. Points are awarded from database triggers so QR/NFC
-- redemptions stay consistent across every staff flow.

alter table public.profiles
  add column if not exists birth_date date;

create table if not exists public.loyalty_settings (
  id boolean primary key default true check (id),
  points_per_redemption int not null default 10 check (points_per_redemption >= 0),
  referred_customer_points int not null default 50 check (referred_customer_points >= 0),
  updated_at timestamptz not null default now()
);

insert into public.loyalty_settings (id, points_per_redemption, referred_customer_points)
values (true, 10, 50)
on conflict (id) do nothing;

create table if not exists public.loyalty_tiers (
  slug text primary key check (slug in ('bronze','silver','gold')),
  name_ar text not null,
  name_en text not null,
  min_points int not null check (min_points >= 0),
  points_multiplier numeric(5,2) not null default 1 check (points_multiplier >= 1),
  birthday_points int not null default 50 check (birthday_points >= 0),
  referral_points int not null default 100 check (referral_points >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.loyalty_tiers
  (slug, name_ar, name_en, min_points, points_multiplier, birthday_points, referral_points, sort_order)
values
  ('bronze', 'برونزي', 'Bronze', 0,   1.00, 50, 100, 1),
  ('silver', 'فضي',    'Silver', 200, 1.10, 75, 125, 2),
  ('gold',   'ذهبي',   'Gold',   500, 1.25, 100, 150, 3)
on conflict (slug) do nothing;

create table if not exists public.loyalty_accounts (
  customer_id uuid primary key references public.profiles(id) on delete cascade,
  points_balance int not null default 0 check (points_balance >= 0),
  lifetime_points int not null default 0 check (lifetime_points >= 0),
  referral_code text not null unique,
  referred_by uuid references public.profiles(id) on delete set null,
  birthday_rewarded_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  points int not null,
  type text not null check (type in (
    'redemption','birthday','referral_bonus','referral_welcome',
    'offer_claim','offer_reward','admin_adjustment'
  )),
  description text not null default '',
  source_redemption_id uuid references public.redemptions(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_customer_id uuid not null unique references public.profiles(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending','rewarded','cancelled')),
  reward_points int not null default 0 check (reward_points >= 0),
  created_at timestamptz not null default now(),
  rewarded_at timestamptz
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  body_ar text not null default '',
  body_en text not null default '',
  badge_ar text not null default '',
  badge_en text not null default '',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  target_tier text check (target_tier in ('bronze','silver','gold')),
  points_cost int not null default 0 check (points_cost >= 0),
  reward_points int not null default 0 check (reward_points >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offer_claims (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  points_spent int not null default 0 check (points_spent >= 0),
  status text not null default 'claimed' check (status in ('claimed','used','cancelled')),
  claimed_at timestamptz not null default now(),
  unique (offer_id, customer_id)
);

create table if not exists public.double_point_days (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  day date not null unique,
  multiplier numeric(5,2) not null default 2 check (multiplier >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  body_ar text not null default '',
  body_en text not null default '',
  kind text not null default 'info' check (kind in ('info','success','reward','offer')),
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_transactions_customer_id on public.loyalty_transactions(customer_id);
create index if not exists idx_loyalty_transactions_created_at on public.loyalty_transactions(created_at desc);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_offers_active_dates on public.offers(is_active, starts_at, ends_at);
create index if not exists idx_offer_claims_customer_id on public.offer_claims(customer_id);
create index if not exists idx_double_point_days_day on public.double_point_days(day);
create index if not exists idx_notifications_user_id on public.notifications(user_id, read_at, created_at desc);

alter table public.loyalty_settings enable row level security;
alter table public.loyalty_tiers enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.offers enable row level security;
alter table public.offer_claims enable row level security;
alter table public.double_point_days enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "loyalty settings read" on public.loyalty_settings;
create policy "loyalty settings read" on public.loyalty_settings
  for select using (auth.uid() is not null);
drop policy if exists "loyalty settings admin write" on public.loyalty_settings;
create policy "loyalty settings admin write" on public.loyalty_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "loyalty tiers read" on public.loyalty_tiers;
create policy "loyalty tiers read" on public.loyalty_tiers
  for select using (auth.uid() is not null);
drop policy if exists "loyalty tiers admin write" on public.loyalty_tiers;
create policy "loyalty tiers admin write" on public.loyalty_tiers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "loyalty accounts own read" on public.loyalty_accounts;
create policy "loyalty accounts own read" on public.loyalty_accounts
  for select using (customer_id = auth.uid());
drop policy if exists "loyalty accounts staff read" on public.loyalty_accounts;
create policy "loyalty accounts staff read" on public.loyalty_accounts
  for select using (public.is_staff());
drop policy if exists "loyalty accounts admin write" on public.loyalty_accounts;
create policy "loyalty accounts admin write" on public.loyalty_accounts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "loyalty transactions own read" on public.loyalty_transactions;
create policy "loyalty transactions own read" on public.loyalty_transactions
  for select using (customer_id = auth.uid());
drop policy if exists "loyalty transactions admin read" on public.loyalty_transactions;
create policy "loyalty transactions admin read" on public.loyalty_transactions
  for select using (public.is_admin());
drop policy if exists "loyalty transactions staff read" on public.loyalty_transactions;
create policy "loyalty transactions staff read" on public.loyalty_transactions
  for select using (public.is_staff());

drop policy if exists "referrals own read" on public.referrals;
create policy "referrals own read" on public.referrals
  for select using (referrer_id = auth.uid() or referred_customer_id = auth.uid());
drop policy if exists "referrals admin write" on public.referrals;
create policy "referrals admin write" on public.referrals
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "offers customer read active" on public.offers;
create policy "offers customer read active" on public.offers
  for select using (
    auth.uid() is not null and is_active
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );
drop policy if exists "offers admin write" on public.offers;
create policy "offers admin write" on public.offers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "offer claims own read" on public.offer_claims;
create policy "offer claims own read" on public.offer_claims
  for select using (customer_id = auth.uid());
drop policy if exists "offer claims admin read" on public.offer_claims;
create policy "offer claims admin read" on public.offer_claims
  for select using (public.is_admin());

drop policy if exists "double point days read" on public.double_point_days;
create policy "double point days read" on public.double_point_days
  for select using (auth.uid() is not null and (is_active or public.is_admin()));
drop policy if exists "double point days admin write" on public.double_point_days;
create policy "double point days admin write" on public.double_point_days
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists "notifications own mark read" on public.notifications;
create policy "notifications own mark read" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications admin write" on public.notifications;
create policy "notifications admin write" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.ensure_loyalty_account(p_customer uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
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

create or replace function public.current_loyalty_tier(p_lifetime_points int)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select slug
    from public.loyalty_tiers
    where is_active and min_points <= greatest(p_lifetime_points, 0)
    order by min_points desc, sort_order desc
    limit 1
  ), 'bronze');
$$;

create or replace function public.current_loyalty_multiplier()
returns numeric
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(max(multiplier), 1)
  from public.double_point_days
  where is_active
    and day = ((now() at time zone 'Asia/Muscat')::date);
$$;

create or replace function public.notify_user(
  p_user uuid,
  p_title_ar text,
  p_title_en text,
  p_body_ar text default '',
  p_body_en text default '',
  p_kind text default 'info',
  p_href text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications
    (user_id, title_ar, title_en, body_ar, body_en, kind, href)
  values
    (p_user, p_title_ar, p_title_en, coalesce(p_body_ar, ''), coalesce(p_body_en, ''),
     coalesce(p_kind, 'info'), p_href);
end;
$$;

create or replace function public.add_loyalty_points(
  p_customer uuid,
  p_points int,
  p_type text,
  p_description text,
  p_source_redemption uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_balance int;
  new_balance int;
begin
  if p_points = 0 then
    select points_balance into current_balance
    from public.loyalty_accounts
    where customer_id = p_customer;
    return coalesce(current_balance, 0);
  end if;

  perform public.ensure_loyalty_account(p_customer);

  select points_balance into current_balance
  from public.loyalty_accounts
  where customer_id = p_customer
  for update;

  if current_balance is null then
    raise exception 'loyalty account not found' using errcode = 'P0002';
  end if;

  new_balance := current_balance + p_points;
  if new_balance < 0 then
    raise exception 'insufficient_points' using errcode = '22003';
  end if;

  update public.loyalty_accounts
  set
    points_balance = new_balance,
    lifetime_points = lifetime_points + greatest(p_points, 0),
    updated_at = now()
  where customer_id = p_customer;

  insert into public.loyalty_transactions
    (customer_id, points, type, description, source_redemption_id, metadata)
  values
    (p_customer, p_points, p_type, coalesce(p_description, ''), p_source_redemption,
     coalesce(p_metadata, '{}'::jsonb));

  return new_balance;
end;
$$;

create or replace function public.handle_customer_loyalty_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role = 'customer' then
    perform public.ensure_loyalty_account(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_create_loyalty on public.profiles;
create trigger on_profile_create_loyalty
  after insert or update of role on public.profiles
  for each row execute function public.handle_customer_loyalty_account();

create or replace function public.award_redemption_loyalty()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  settings_row public.loyalty_settings%rowtype;
  account_row public.loyalty_accounts%rowtype;
  tier_slug text;
  tier_multiplier numeric;
  day_multiplier numeric;
  awarded_points int;
begin
  perform public.ensure_loyalty_account(new.customer_id);

  select * into settings_row from public.loyalty_settings where id = true;
  select * into account_row from public.loyalty_accounts where customer_id = new.customer_id;
  tier_slug := public.current_loyalty_tier(account_row.lifetime_points);

  select coalesce(points_multiplier, 1) into tier_multiplier
  from public.loyalty_tiers
  where slug = tier_slug;

  day_multiplier := public.current_loyalty_multiplier();
  awarded_points := ceil(coalesce(settings_row.points_per_redemption, 10) * coalesce(tier_multiplier, 1) * coalesce(day_multiplier, 1))::int;

  if awarded_points > 0 then
    perform public.add_loyalty_points(
      new.customer_id,
      awarded_points,
      'redemption',
      'Cup redemption',
      new.id,
      jsonb_build_object('tier', tier_slug, 'day_multiplier', day_multiplier)
    );

    perform public.notify_user(
      new.customer_id,
      'تمت إضافة نقاط',
      'Points added',
      '+' || awarded_points || ' نقطة بعد تسجيل كوبك.',
      '+' || awarded_points || ' points after your cup was recorded.',
      'reward',
      '/dashboard'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_redemption_award_loyalty on public.redemptions;
create trigger on_redemption_award_loyalty
  after insert on public.redemptions
  for each row execute function public.award_redemption_loyalty();

create or replace function public.award_birthday_loyalty(p_customer uuid)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_birth date;
  current_year int := extract(year from (now() at time zone 'Asia/Muscat'))::int;
  account_row public.loyalty_accounts%rowtype;
  tier_slug text;
  gift_points int;
begin
  if auth.uid() <> p_customer and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform public.ensure_loyalty_account(p_customer);

  select birth_date into profile_birth
  from public.profiles
  where id = p_customer and role = 'customer';

  if profile_birth is null then
    return 0;
  end if;

  if to_char(profile_birth, 'MM-DD') <> to_char((now() at time zone 'Asia/Muscat')::date, 'MM-DD') then
    return 0;
  end if;

  select * into account_row
  from public.loyalty_accounts
  where customer_id = p_customer
  for update;

  if account_row.birthday_rewarded_year = current_year then
    return 0;
  end if;

  tier_slug := public.current_loyalty_tier(account_row.lifetime_points);
  select birthday_points into gift_points
  from public.loyalty_tiers
  where slug = tier_slug;

  gift_points := coalesce(gift_points, 0);
  if gift_points > 0 then
    perform public.add_loyalty_points(
      p_customer,
      gift_points,
      'birthday',
      'Birthday gift',
      null,
      jsonb_build_object('year', current_year, 'tier', tier_slug)
    );
    perform public.notify_user(
      p_customer,
      'هدية عيد ميلادك وصلت',
      'Your birthday gift is here',
      '+' || gift_points || ' نقطة هدية من ديستركت 7.',
      '+' || gift_points || ' birthday points from District 7.',
      'reward',
      '/dashboard'
    );
  end if;

  update public.loyalty_accounts
  set birthday_rewarded_year = current_year, updated_at = now()
  where customer_id = p_customer;

  return gift_points;
end;
$$;

create or replace function public.process_referral_reward(p_referred_customer uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  referral_row public.referrals%rowtype;
  settings_row public.loyalty_settings%rowtype;
  ref_account public.loyalty_accounts%rowtype;
  ref_tier text;
  ref_points int;
  welcome_points int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into referral_row
  from public.referrals
  where referred_customer_id = p_referred_customer
    and status = 'pending'
  for update;

  if not found then
    return false;
  end if;

  select * into settings_row from public.loyalty_settings where id = true;
  perform public.ensure_loyalty_account(referral_row.referrer_id);
  perform public.ensure_loyalty_account(referral_row.referred_customer_id);

  select * into ref_account
  from public.loyalty_accounts
  where customer_id = referral_row.referrer_id;

  ref_tier := public.current_loyalty_tier(coalesce(ref_account.lifetime_points, 0));
  select referral_points into ref_points
  from public.loyalty_tiers
  where slug = ref_tier;

  ref_points := coalesce(ref_points, 0);
  welcome_points := coalesce(settings_row.referred_customer_points, 0);

  if ref_points > 0 then
    perform public.add_loyalty_points(
      referral_row.referrer_id,
      ref_points,
      'referral_bonus',
      'Referral bonus',
      null,
      jsonb_build_object('referred_customer_id', p_referred_customer)
    );
    perform public.notify_user(
      referral_row.referrer_id,
      'مكافأة إحالة',
      'Referral reward',
      '+' || ref_points || ' نقطة لأن صديقك اشترك.',
      '+' || ref_points || ' points because your friend subscribed.',
      'reward',
      '/dashboard'
    );
  end if;

  if welcome_points > 0 then
    perform public.add_loyalty_points(
      referral_row.referred_customer_id,
      welcome_points,
      'referral_welcome',
      'Referral welcome gift',
      null,
      jsonb_build_object('referrer_id', referral_row.referrer_id)
    );
    perform public.notify_user(
      referral_row.referred_customer_id,
      'هدية ترحيبية',
      'Welcome gift',
      '+' || welcome_points || ' نقطة لأنك دخلت بكود إحالة.',
      '+' || welcome_points || ' points for joining with a referral code.',
      'reward',
      '/dashboard'
    );
  end if;

  update public.referrals
  set status = 'rewarded', reward_points = ref_points, rewarded_at = now()
  where id = referral_row.id;

  return true;
end;
$$;

create or replace function public.get_my_loyalty_summary()
returns table (
  customer_id uuid,
  points_balance int,
  lifetime_points int,
  tier_slug text,
  tier_name_ar text,
  tier_name_en text,
  next_tier_slug text,
  next_tier_name_ar text,
  next_tier_name_en text,
  points_to_next int,
  referral_code text,
  birth_date date
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  awarded int;
begin
  if uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = uid and role = 'customer') then
    return;
  end if;

  awarded := public.award_birthday_loyalty(uid);

  return query
  with account as (
    select la.*, p.birth_date
    from public.loyalty_accounts la
    join public.profiles p on p.id = la.customer_id
    where la.customer_id = uid
  ),
  current_tier as (
    select t.*
    from account a
    join public.loyalty_tiers t on t.slug = public.current_loyalty_tier(a.lifetime_points)
  ),
  next_tier as (
    select t.*
    from public.loyalty_tiers t, account a
    where t.min_points > a.lifetime_points
      and t.is_active
    order by t.min_points asc
    limit 1
  )
  select
    a.customer_id,
    a.points_balance,
    a.lifetime_points,
    ct.slug,
    ct.name_ar,
    ct.name_en,
    nt.slug,
    nt.name_ar,
    nt.name_en,
    case when nt.slug is null then 0 else greatest(nt.min_points - a.lifetime_points, 0) end,
    a.referral_code,
    a.birth_date
  from account a
  cross join current_tier ct
  left join next_tier nt on true;
end;
$$;

create or replace function public.get_active_offers()
returns table (
  id uuid,
  title_ar text,
  title_en text,
  body_ar text,
  body_en text,
  badge_ar text,
  badge_en text,
  target_tier text,
  points_cost int,
  reward_points int,
  ends_at timestamptz,
  already_claimed boolean,
  can_claim boolean
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  account_points int;
  tier_slug text;
begin
  if uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform public.ensure_loyalty_account(uid);

  select points_balance, public.current_loyalty_tier(lifetime_points)
  into account_points, tier_slug
  from public.loyalty_accounts
  where customer_id = uid;

  return query
  select
    o.id,
    o.title_ar,
    o.title_en,
    o.body_ar,
    o.body_en,
    o.badge_ar,
    o.badge_en,
    o.target_tier,
    o.points_cost,
    o.reward_points,
    o.ends_at,
    exists (
      select 1 from public.offer_claims oc
      where oc.offer_id = o.id and oc.customer_id = uid
    ) as already_claimed,
    (
      coalesce(account_points, 0) >= o.points_cost
      and not exists (
        select 1 from public.offer_claims oc
        where oc.offer_id = o.id and oc.customer_id = uid
      )
    ) as can_claim
  from public.offers o
  where o.is_active
    and o.starts_at <= now()
    and (o.ends_at is null or o.ends_at >= now())
    and (o.target_tier is null or o.target_tier = tier_slug)
  order by o.sort_order, o.created_at desc;
end;
$$;

create or replace function public.claim_offer(p_offer_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  offer_row public.offers%rowtype;
  account_row public.loyalty_accounts%rowtype;
  tier_slug text;
begin
  if uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform public.ensure_loyalty_account(uid);

  select * into offer_row
  from public.offers
  where id = p_offer_id
    and is_active
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  for update;

  if not found then
    return 'not_found';
  end if;

  select * into account_row
  from public.loyalty_accounts
  where customer_id = uid
  for update;

  tier_slug := public.current_loyalty_tier(account_row.lifetime_points);
  if offer_row.target_tier is not null and offer_row.target_tier <> tier_slug then
    return 'wrong_tier';
  end if;

  if exists (select 1 from public.offer_claims where offer_id = p_offer_id and customer_id = uid) then
    return 'already_claimed';
  end if;

  if account_row.points_balance < offer_row.points_cost then
    return 'not_enough_points';
  end if;

  if offer_row.points_cost > 0 then
    perform public.add_loyalty_points(
      uid,
      -offer_row.points_cost,
      'offer_claim',
      'Offer claim',
      null,
      jsonb_build_object('offer_id', p_offer_id)
    );
  end if;

  if offer_row.reward_points > 0 then
    perform public.add_loyalty_points(
      uid,
      offer_row.reward_points,
      'offer_reward',
      'Offer reward',
      null,
      jsonb_build_object('offer_id', p_offer_id)
    );
  end if;

  insert into public.offer_claims (offer_id, customer_id, points_spent)
  values (p_offer_id, uid, offer_row.points_cost);

  perform public.notify_user(
    uid,
    'تم تفعيل العرض',
    'Offer claimed',
    offer_row.title_ar,
    offer_row.title_en,
    'offer',
    '/dashboard'
  );

  return 'success';
end;
$$;

create or replace function public.admin_loyalty_kpis()
returns table (
  points_issued int,
  points_spent int,
  active_offers int,
  claims_count int,
  upcoming_double_days int
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
  select
    coalesce(sum(points) filter (where points > 0), 0)::int as points_issued,
    abs(coalesce(sum(points) filter (where points < 0), 0))::int as points_spent,
    (select count(*)::int from public.offers where is_active and starts_at <= now() and (ends_at is null or ends_at >= now())),
    (select count(*)::int from public.offer_claims),
    (select count(*)::int from public.double_point_days where is_active and day >= ((now() at time zone 'Asia/Muscat')::date))
  from public.loyalty_transactions;
end;
$$;

create or replace function public.admin_adjust_loyalty_points(
  p_customer uuid,
  p_points int,
  p_description text default ''
)
returns int
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  new_balance int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_points = 0 then
    raise exception 'points must not be zero' using errcode = '22023';
  end if;

  new_balance := public.add_loyalty_points(
    p_customer,
    p_points,
    'admin_adjustment',
    coalesce(nullif(p_description, ''), 'Admin adjustment'),
    null,
    jsonb_build_object('admin_id', auth.uid())
  );

  perform public.notify_user(
    p_customer,
    case when p_points > 0 then 'تمت إضافة نقاط' else 'تم تعديل النقاط' end,
    case when p_points > 0 then 'Points added' else 'Points adjusted' end,
    coalesce(nullif(p_description, ''), (p_points::text || ' نقطة')),
    coalesce(nullif(p_description, ''), (p_points::text || ' points')),
    'reward',
    '/dashboard'
  );

  return new_balance;
end;
$$;

revoke all on function public.ensure_loyalty_account(uuid) from public, anon;
revoke all on function public.current_loyalty_tier(int) from public, anon;
revoke all on function public.current_loyalty_multiplier() from public, anon;
revoke all on function public.notify_user(uuid, text, text, text, text, text, text) from public, anon;
revoke all on function public.add_loyalty_points(uuid, int, text, text, uuid, jsonb) from public, anon;
revoke all on function public.award_birthday_loyalty(uuid) from public, anon;
revoke all on function public.process_referral_reward(uuid) from public, anon;
revoke all on function public.get_my_loyalty_summary() from public, anon;
revoke all on function public.get_active_offers() from public, anon;
revoke all on function public.claim_offer(uuid) from public, anon;
revoke all on function public.admin_loyalty_kpis() from public, anon;
revoke all on function public.admin_adjust_loyalty_points(uuid, int, text) from public, anon;

grant execute on function public.award_birthday_loyalty(uuid) to authenticated;
grant execute on function public.process_referral_reward(uuid) to authenticated;
grant execute on function public.get_my_loyalty_summary() to authenticated;
grant execute on function public.get_active_offers() to authenticated;
grant execute on function public.claim_offer(uuid) to authenticated;
grant execute on function public.admin_loyalty_kpis() to authenticated;
grant execute on function public.admin_adjust_loyalty_points(uuid, int, text) to authenticated;

-- Backfill loyalty accounts for existing customers.
do $$
declare
  customer record;
begin
  for customer in
    select id from public.profiles where role = 'customer'
  loop
    perform public.ensure_loyalty_account(customer.id);
  end loop;
end;
$$;
