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
