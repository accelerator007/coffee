'use server'

import { adminClient } from '@/lib/supabase/admin'
import { normalizeOmanPhone, phoneAuthEmail } from '@/lib/phone'

function readCreatedUserId(value: unknown) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return readCreatedUserId(value[0])
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return readCreatedUserId(record.id ?? record.admin_create_internal_auth_user)
  }
  return null
}

/**
 * Open self-registration for customers. This is intentionally NOT admin-gated:
 * a visitor with no session creates their own "points-only" customer account.
 * The account starts without a subscription; an admin can add one later. The
 * privileged `admin_create_internal_auth_user` RPC is service-role only, so the
 * client can never call it directly — only through this server action, which
 * hard-codes the customer role.
 */
export async function registerCustomer(data: {
  full_name: string
  phone: string
  password: string
  birth_date?: string
  referral_code?: string
}) {
  try {
    const normalized = normalizeOmanPhone(data.phone)
    if (!normalized.ok) return { error: 'رقم الهاتف غير صحيح' }

    const fullName = data.full_name.trim()
    if (!fullName) return { error: 'الاسم مطلوب' }

    if ((data.password ?? '').length < 6) return { error: 'passwordTooShort' }

    const phone = normalized.international
    const email = phoneAuthEmail(normalized.local)
    const referralCode = data.referral_code?.trim().toUpperCase() || ''
    let referrerId: string | null = null

    if (referralCode) {
      const { data: referrer } = await adminClient
        .from('loyalty_accounts')
        .select('customer_id, referral_code')
        .eq('referral_code', referralCode)
        .maybeSingle()

      if (!referrer) return { error: 'referralNotFound' }
      referrerId = referrer.customer_id
    }

    const { data: createdUserId, error } = await adminClient.rpc('admin_create_internal_auth_user', {
      p_email: email,
      p_password: data.password,
      p_role: 'customer',
      p_full_name: fullName,
      p_phone: phone,
      p_username: null,
      p_birth_date: data.birth_date || null,
    })

    if (error) {
      if (error.message.includes('user_email_exists') || error.message.includes('user_phone_exists') || error.message.includes('user_already_exists')) {
        return { error: 'phoneAlreadyRegistered' }
      }
      return { error: error.message }
    }

    const userId = readCreatedUserId(createdUserId)
    if (!userId) return { error: 'تعذّر إنشاء الحساب' }

    if (referralCode && referrerId && referrerId !== userId) {
      await adminClient.rpc('ensure_loyalty_account', { p_customer: userId })
      await adminClient
        .from('loyalty_accounts')
        .update({ referred_by: referrerId, updated_at: new Date().toISOString() })
        .eq('customer_id', userId)
      await adminClient.from('referrals').insert({
        referrer_id: referrerId,
        referred_customer_id: userId,
        referral_code: referralCode,
        status: 'pending',
      })
    }

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'تعذّر إنشاء الحساب' }
  }
}
