'use server'

import { createClient } from '@/lib/supabase/server'

function getMuscatDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })
}

export async function getCustomerByQR(customerId: string) {
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
