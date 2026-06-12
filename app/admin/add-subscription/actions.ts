'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCustomers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('role', 'customer')
    .order('full_name')
  return data ?? []
}

export async function getPackages() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('packages')
    .select('id, name, duration_days, daily_allowance, price')
    .order('name')
  return data ?? []
}

export async function addSubscription(
  customerId: string,
  packageId: string,
  startDate: string,
  nfcCardId?: string
) {
  const supabase = await createClient()

  // Get package to snapshot duration_days
  const { data: pkg } = await supabase
    .from('packages')
    .select('duration_days')
    .eq('id', packageId)
    .single()

  if (!pkg) return { error: 'الباقة غير موجودة' }

  const { error } = await supabase.from('subscriptions').insert({
    customer_id: customerId,
    package_id: packageId,
    start_date: startDate,
    duration_days: pkg.duration_days,
    nfc_card_id: nfcCardId?.trim() || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}
