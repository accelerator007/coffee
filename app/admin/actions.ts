'use server'

import { createClient } from '@/lib/supabase/server'

function getMuscatDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })
}

export type CustomerReportRow = {
  full_name: string
  phone: string | null
  package_name: string | null
  tier: string | null
  start_date: string | null
  days_left: number | null
  status: 'active' | 'expired' | null
  used_cups: number | null
  total_cups: number | null
  consumption_pct: number | null
  card_uid: string | null
}

type SubRow = {
  id: string
  customer_id: string
  start_date: string
  duration_days: number
  created_at: string
  packages: { name: string; tier: string | null; daily_allowance: number } | null
}

/**
 * Customer report for the Excel export: each customer with their current
 * (latest) subscription, its package, and how much of the package's total
 * cup allowance they have consumed. Reads run under RLS, so only an admin
 * session gets data back.
 */
export async function exportCustomersReport(): Promise<CustomerReportRow[]> {
  const supabase = await createClient()

  const [profilesRes, subsRes, redsRes, cardsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'customer')
      .order('full_name'),
    supabase
      .from('subscriptions')
      .select('id, customer_id, start_date, duration_days, created_at, packages(name, tier, daily_allowance)'),
    supabase
      .from('redemptions')
      .select('subscription_id'),
    supabase
      .from('cards')
      .select('card_uid, customer_id')
      .not('customer_id', 'is', null),
  ])

  const profiles = profilesRes.data ?? []
  const subs = (subsRes.data ?? []) as unknown as SubRow[]
  const reds = redsRes.data ?? []
  const cards = (cardsRes.data ?? []) as { card_uid: string; customer_id: string }[]

  // A customer may hold more than one card; list them all so the export shows
  // every UID linked to that person (blank/no-card customers get "-" in the UI).
  const cardsByCustomer = new Map<string, string[]>()
  for (const c of cards) {
    const list = cardsByCustomer.get(c.customer_id) ?? []
    list.push(c.card_uid)
    cardsByCustomer.set(c.customer_id, list)
  }
  const cardUidFor = (customerId: string) =>
    cardsByCustomer.get(customerId)?.join('، ') ?? null

  // Redemption count per subscription.
  const usedBySub = new Map<string, number>()
  for (const r of reds) {
    usedBySub.set(r.subscription_id, (usedBySub.get(r.subscription_id) ?? 0) + 1)
  }

  // Latest subscription per customer (same "current subscription" ordering
  // as the admin RPCs: start_date desc, created_at desc).
  const latestByCustomer = new Map<string, SubRow>()
  for (const s of subs) {
    const prev = latestByCustomer.get(s.customer_id)
    if (
      !prev ||
      s.start_date > prev.start_date ||
      (s.start_date === prev.start_date && s.created_at > prev.created_at)
    ) {
      latestByCustomer.set(s.customer_id, s)
    }
  }

  const today = getMuscatDate()

  return profiles.map(p => {
    const sub = latestByCustomer.get(p.id)
    if (!sub) {
      return {
        full_name: p.full_name || '—',
        phone: p.phone,
        package_name: null,
        tier: null,
        start_date: null,
        days_left: null,
        status: null,
        used_cups: null,
        total_cups: null,
        consumption_pct: null,
        card_uid: cardUidFor(p.id),
      }
    }

    const daysLeft = sub.duration_days - Math.floor(
      (new Date(today).getTime() - new Date(sub.start_date).getTime()) / 86400000
    )
    const usedCups = usedBySub.get(sub.id) ?? 0
    const totalCups = sub.duration_days * (sub.packages?.daily_allowance ?? 0)
    const consumptionPct = totalCups > 0 ? Math.round((usedCups / totalCups) * 100) : 0

    return {
      full_name: p.full_name || '—',
      phone: p.phone,
      package_name: sub.packages?.name ?? null,
      tier: sub.packages?.tier ?? null,
      start_date: sub.start_date,
      days_left: daysLeft,
      status: daysLeft > 0 ? 'active' as const : 'expired' as const,
      used_cups: usedCups,
      total_cups: totalCups,
      consumption_pct: consumptionPct,
      card_uid: cardUidFor(p.id),
    }
  })
}
