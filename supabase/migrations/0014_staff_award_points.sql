-- 0014_staff_award_points.sql
-- Let staff award loyalty points to a "points-only" customer (a customer with
-- no subscription) by scanning their QR and entering a purchased quantity.
-- Subscription cups keep their existing redemption -> points trigger; this path
-- is for walk-in purchases where there is no subscription to redeem against.

-- Allow a new transaction type for staff-recorded purchases.
alter table public.loyalty_transactions
  drop constraint if exists loyalty_transactions_type_check;

alter table public.loyalty_transactions
  add constraint loyalty_transactions_type_check
  check (type in (
    'redemption','birthday','referral_bonus','referral_welcome',
    'offer_claim','offer_reward','admin_adjustment','purchase'
  ));

create or replace function public.staff_award_points(
  p_customer uuid,
  p_quantity int,
  p_description text default ''
)
returns int
language plpgsql
volatile
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
  -- Only admins and employees can award points.
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_customer and role = 'customer'
  ) then
    raise exception 'customer_not_found' using errcode = 'P0002';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'invalid_quantity' using errcode = '22023';
  end if;

  perform public.ensure_loyalty_account(p_customer);

  select * into settings_row from public.loyalty_settings where id = true;
  select * into account_row from public.loyalty_accounts where customer_id = p_customer;

  tier_slug := public.current_loyalty_tier(account_row.lifetime_points);
  select coalesce(points_multiplier, 1) into tier_multiplier
  from public.loyalty_tiers
  where slug = tier_slug;

  day_multiplier := public.current_loyalty_multiplier();

  awarded_points := ceil(
    coalesce(settings_row.points_per_redemption, 10)
    * p_quantity
    * coalesce(tier_multiplier, 1)
    * coalesce(day_multiplier, 1)
  )::int;

  if awarded_points <= 0 then
    return 0;
  end if;

  perform public.add_loyalty_points(
    p_customer,
    awarded_points,
    'purchase',
    coalesce(nullif(p_description, ''), 'Purchase points'),
    null,
    jsonb_build_object(
      'staff_id', auth.uid(),
      'quantity', p_quantity,
      'tier', tier_slug,
      'day_multiplier', day_multiplier
    )
  );

  perform public.notify_user(
    p_customer,
    'تمت إضافة نقاط',
    'Points added',
    '+' || awarded_points || ' نقطة بعد عملية الشراء.',
    '+' || awarded_points || ' points after your purchase.',
    'reward',
    '/dashboard'
  );

  return awarded_points;
end;
$$;

revoke all on function public.staff_award_points(uuid, int, text) from public, anon;
grant execute on function public.staff_award_points(uuid, int, text) to authenticated;
