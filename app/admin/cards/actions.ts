'use server'

import { createClient } from '@/lib/supabase/server'

export type CardStatus = 'active' | 'unassigned' | 'lost' | 'blocked'

export type CardRow = {
  id: string
  card_uid: string
  status: CardStatus
  label: string | null
  notes: string | null
  created_at: string
  customer: { id: string; full_name: string; phone: string | null } | null
}

const DUPLICATE_UID = '23505'

export async function listCards(): Promise<CardRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cards')
    .select('id, card_uid, status, label, notes, created_at, customer:profiles!customer_id(id, full_name, phone)')
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as CardRow[]
}

export async function createCard(input: {
  card_uid: string
  customer_id?: string | null
  label?: string
}) {
  const cardUid = input.card_uid.trim()
  if (!cardUid) return { error: 'empty' as const }

  const supabase = await createClient()
  const { error } = await supabase.from('cards').insert({
    card_uid: cardUid,
    customer_id: input.customer_id || null,
    label: input.label?.trim() || null,
    status: input.customer_id ? 'active' : 'unassigned',
  })

  if (error) {
    if (error.code === DUPLICATE_UID) return { error: 'duplicate' as const }
    return { error: error.message }
  }
  return { success: true }
}

export async function updateCard(id: string, input: {
  card_uid?: string
  label?: string | null
}) {
  const supabase = await createClient()
  const patch: Record<string, string | null> = { updated_at: new Date().toISOString() }
  if (input.card_uid !== undefined) {
    const cardUid = input.card_uid.trim()
    if (!cardUid) return { error: 'empty' as const }
    patch.card_uid = cardUid
  }
  if (input.label !== undefined) patch.label = input.label?.trim() || null

  const { error } = await supabase.from('cards').update(patch).eq('id', id)
  if (error) {
    if (error.code === DUPLICATE_UID) return { error: 'duplicate' as const }
    return { error: error.message }
  }
  return { success: true }
}

export async function assignCard(id: string, customerId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cards')
    .update({ customer_id: customerId, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function unassignCard(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cards')
    .update({ customer_id: null, status: 'unassigned', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function setCardStatus(id: string, status: Exclude<CardStatus, 'unassigned'>) {
  const supabase = await createClient()

  if (status === 'active') {
    // A card can only be re-activated while it is linked to a customer.
    const { data: card } = await supabase
      .from('cards')
      .select('customer_id')
      .eq('id', id)
      .single()
    if (!card?.customer_id) return { error: 'unassigned' as const }
  }

  const { error } = await supabase
    .from('cards')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteCard(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
