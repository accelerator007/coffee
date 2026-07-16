'use server'

import { adminClient } from '@/lib/supabase/admin'
import { hasCurrentUserRole } from '@/lib/auth/roles'

export type LoyaltyTier = 'bronze' | 'silver' | 'gold'

export type LoyaltySettingsInput = {
  points_per_redemption: number
  referred_customer_points: number
}

export type LoyaltyTierInput = {
  min_points: number
  points_multiplier: number
  birthday_points: number
  referral_points: number
  is_active: boolean
}

export type OfferInput = {
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  badge_ar: string
  badge_en: string
  starts_at: string
  ends_at: string | null
  is_active: boolean
  target_tier: LoyaltyTier | null
  points_cost: number
  reward_points: number
  sort_order: number
}

export type DoublePointDayInput = {
  title_ar: string
  title_en: string
  day: string
  multiplier: number
  is_active: boolean
}

async function requireAdmin() {
  return hasCurrentUserRole('admin')
}

export async function updateLoyaltySettings(input: LoyaltySettingsInput) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const points = Math.max(0, Math.floor(input.points_per_redemption))
  const welcome = Math.max(0, Math.floor(input.referred_customer_points))

  const { error } = await adminClient
    .from('loyalty_settings')
    .upsert({
      id: true,
      points_per_redemption: points,
      referred_customer_points: welcome,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateLoyaltyTier(slug: LoyaltyTier, input: LoyaltyTierInput) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const { error } = await adminClient
    .from('loyalty_tiers')
    .update({
      min_points: Math.max(0, Math.floor(input.min_points)),
      points_multiplier: Math.max(1, input.points_multiplier),
      birthday_points: Math.max(0, Math.floor(input.birthday_points)),
      referral_points: Math.max(0, Math.floor(input.referral_points)),
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  if (error) return { error: error.message }
  return { success: true }
}

function cleanOffer(input: OfferInput) {
  return {
    title_ar: input.title_ar.trim(),
    title_en: input.title_en.trim(),
    body_ar: input.body_ar.trim(),
    body_en: input.body_en.trim(),
    badge_ar: input.badge_ar.trim(),
    badge_en: input.badge_en.trim(),
    starts_at: input.starts_at,
    ends_at: input.ends_at || null,
    is_active: input.is_active,
    target_tier: input.target_tier,
    points_cost: Math.max(0, Math.floor(input.points_cost)),
    reward_points: Math.max(0, Math.floor(input.reward_points)),
    sort_order: Math.floor(input.sort_order || 0),
    updated_at: new Date().toISOString(),
  }
}

export async function createOffer(input: OfferInput) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const payload = cleanOffer(input)
  if (!payload.title_ar || !payload.title_en) {
    return { error: 'عنوان العرض مطلوب بالعربي والإنجليزي' }
  }

  const { error } = await adminClient.from('offers').insert(payload)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateOffer(id: string, input: OfferInput) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const payload = cleanOffer(input)
  if (!payload.title_ar || !payload.title_en) {
    return { error: 'عنوان العرض مطلوب بالعربي والإنجليزي' }
  }

  const { error } = await adminClient.from('offers').update(payload).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteOffer(id: string) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const { error } = await adminClient.from('offers').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function createDoublePointDay(input: DoublePointDayInput) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const titleAr = input.title_ar.trim()
  const titleEn = input.title_en.trim()
  if (!titleAr || !titleEn || !input.day) {
    return { error: 'بيانات يوم النقاط المضاعفة ناقصة' }
  }

  const { error } = await adminClient.from('double_point_days').insert({
    title_ar: titleAr,
    title_en: titleEn,
    day: input.day,
    multiplier: Math.max(1, input.multiplier),
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteDoublePointDay(id: string) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const { error } = await adminClient.from('double_point_days').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function adjustCustomerPoints(customerId: string, points: number, description: string) {
  if (!(await requireAdmin())) return { error: 'not_authorized' }

  const rounded = Math.trunc(points)
  if (!customerId || rounded === 0) {
    return { error: 'اختر العميل واكتب نقاطاً موجبة أو سالبة' }
  }

  const { data, error } = await adminClient.rpc('admin_adjust_loyalty_points', {
    p_customer: customerId,
    p_points: rounded,
    p_description: description.trim(),
  })

  if (error) return { error: error.message }
  return { success: true, balance: data as number }
}
