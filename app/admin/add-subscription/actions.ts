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

  // Validate the card BEFORE inserting the subscription so a card conflict
  // never leaves a subscription created with an unusable card.
  const cardUid = nfcCardId?.trim() || null
  let existingCard: { id: string; status: string; customer_id: string | null } | null = null
  if (cardUid) {
    const { data: card } = await supabase
      .from('cards')
      .select('id, status, customer_id, customer:profiles!customer_id(full_name)')
      .eq('card_uid', cardUid)
      .maybeSingle()

    if (card) {
      if (card.customer_id && card.customer_id !== customerId) {
        const name = (card.customer as unknown as { full_name: string } | null)?.full_name ?? '—'
        return { error: `هذه البطاقة مرتبطة بعميل آخر: ${name} — يمكن إعادة ربطها من صفحة البطاقات` }
      }
      if (card.status === 'lost' || card.status === 'blocked') {
        return { error: 'هذه البطاقة مفقودة أو محظورة — فعّلها من صفحة البطاقات أولاً' }
      }
      existingCard = card
    }
  }

  const { error } = await supabase.from('subscriptions').insert({
    customer_id: customerId,
    package_id: packageId,
    start_date: startDate,
    duration_days: pkg.duration_days,
  })

  if (error) return { error: error.message }

  // Link the card to the customer in the cards registry.
  if (cardUid) {
    const { error: cardError } = existingCard
      ? await supabase
          .from('cards')
          .update({ customer_id: customerId, status: 'active', updated_at: new Date().toISOString() })
          .eq('id', existingCard.id)
      : await supabase
          .from('cards')
          .insert({ card_uid: cardUid, customer_id: customerId, status: 'active' })

    if (cardError) {
      return { error: `تم إنشاء الاشتراك، لكن تعذّر ربط البطاقة: ${cardError.message}` }
    }
  }

  // Referral rewards are granted only after the referred customer gets their
  // first real subscription.
  await supabase.rpc('process_referral_reward', { p_referred_customer: customerId })

  return { success: true }
}
