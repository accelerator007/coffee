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
