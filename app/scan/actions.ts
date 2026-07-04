'use server'

import { createClient } from '@/lib/supabase/server'

function getMuscatDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })
}

export async function getCustomerByQR(customerId: string) {
  // Validate that customerId looks like a UUID before querying
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(customerId)) {
    return { error: 'invalid_qr' as const }
  }

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', customerId)
    .eq('role', 'customer')
    .single()

  if (profileError || !profile) {
    return { error: 'invalid_qr' as const }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('customer_id', customerId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription) {
    return { customer: profile, subscription: null, daysLeft: 0, todayUsed: 0 }
  }

  const today = getMuscatDate()
  const daysLeft = subscription.duration_days - Math.floor(
    (new Date(today).getTime() - new Date(subscription.start_date).getTime()) / 86400000
  )

  const { count } = await supabase
    .from('redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscription.id)
    .eq('day', today)

  return {
    customer: profile,
    subscription,
    daysLeft,
    todayUsed: count ?? 0,
  }
}

type ScanProfile = { id: string; full_name: string; phone: string | null }

/**
 * Look up a physical card in the cards registry and return its customer.
 * A card with no linked customer is unusable regardless of its status.
 */
async function resolveCard(cardUid: string) {
  const uid = cardUid.trim()
  if (!uid) return { error: 'invalid_nfc' as const }

  const supabase = await createClient()
  const { data: card } = await supabase
    .from('cards')
    .select('id, status, customer_id, customer:profiles!customer_id(id, full_name, phone)')
    .eq('card_uid', uid)
    .maybeSingle()

  if (!card) return { error: 'invalid_nfc' as const }
  if (card.status === 'blocked') return { error: 'card_blocked' as const }
  if (card.status === 'lost') return { error: 'card_lost' as const }
  if (!card.customer_id || !card.customer) return { error: 'card_unassigned' as const }

  return { customer: card.customer as unknown as ScanProfile }
}

export async function getCustomerByNFC(nfcCardId: string) {
  const resolved = await resolveCard(nfcCardId)
  if ('error' in resolved) return { error: resolved.error }

  const supabase = await createClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('customer_id', resolved.customer.id)
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription) {
    return { customer: resolved.customer, subscription: null, daysLeft: 0, todayUsed: 0 }
  }

  const profile = resolved.customer
  const today = getMuscatDate()
  const daysLeft = subscription.duration_days - Math.floor(
    (new Date(today).getTime() - new Date(subscription.start_date).getTime()) / 86400000
  )

  const { count } = await supabase
    .from('redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscription.id)
    .eq('day', today)

  return {
    customer: profile,
    subscription,
    daysLeft,
    todayUsed: count ?? 0,
  }
}

export async function nfcRedeem(nfcCardId: string) {
  const resolved = await resolveCard(nfcCardId)
  if ('error' in resolved) return { error: resolved.error }

  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('customer_id', resolved.customer.id)
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription) return { error: 'no_subscription' as const }

  const today = getMuscatDate()
  const daysLeft = subscription.duration_days - Math.floor(
    (new Date(today).getTime() - new Date(subscription.start_date).getTime()) / 86400000
  )
  if (daysLeft <= 0) return { error: 'expired' as const }

  const pkg = subscription.packages as { name: string; daily_allowance: number }
  const { count } = await supabase
    .from('redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscription.id)
    .eq('day', today)

  if ((count ?? 0) >= pkg.daily_allowance) {
    return { error: 'limit_reached' as const }
  }

  const profile = resolved.customer
  const { error } = await supabase
    .from('redemptions')
    .insert({ subscription_id: subscription.id, customer_id: profile.id, day: today })

  if (error) return { error: 'db_error' as const }

  return {
    success: true,
    customerName: profile.full_name,
    packageName: pkg.name,
    remaining: pkg.daily_allowance - (count ?? 0) - 1,
    daysLeft,
  }
}

export async function recordRedemption(subscriptionId: string, customerId: string) {
  const supabase = await createClient()

  // Check daily allowance first
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) return { error: 'not_found' as const }

  const today = getMuscatDate()
  const { count } = await supabase
    .from('redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscriptionId)
    .eq('day', today)

  const dailyAllowance = (subscription.packages as { daily_allowance: number }).daily_allowance
  if ((count ?? 0) >= dailyAllowance) {
    return { error: 'limit_reached' as const }
  }

  const daysLeft = subscription.duration_days - Math.floor(
    (new Date(today).getTime() - new Date(subscription.start_date).getTime()) / 86400000
  )
  if (daysLeft <= 0) return { error: 'expired' as const }

  const { error } = await supabase
    .from('redemptions')
    .insert({ subscription_id: subscriptionId, customer_id: customerId, day: today })

  if (error) return { error: 'db_error' as const }
  return { success: true }
}
