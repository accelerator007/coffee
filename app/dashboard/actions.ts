'use server'

import { createClient } from '@/lib/supabase/server'

export async function claimOfferAction(offerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('claim_offer', { p_offer_id: offerId })
  if (error) return { error: error.message }
  return { status: data as string }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) return { error: error.message }
  return { success: true }
}
