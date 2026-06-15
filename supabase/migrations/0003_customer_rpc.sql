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
