'use server'

import { adminClient } from '@/lib/supabase/admin'
import { hasCurrentUserRole } from '@/lib/auth/roles'
import { normalizeOmanPhone } from '@/lib/phone'

export async function createCustomer(data: {
  full_name: string
  phone: string
  password: string
  birth_date?: string
  referral_code?: string
}) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  const normalized = normalizeOmanPhone(data.phone)
  if (!normalized.ok) return { error: 'رقم الهاتف غير صحيح' }
  const fullName = data.full_name.trim()
  if (!fullName) return { error: 'الاسم مطلوب' }
  const phone = normalized.international
  const email = `${phone}@phone.local`
  const referralCode = data.referral_code?.trim().toUpperCase() || ''
  let referrerId: string | null = null

  if (referralCode) {
    const { data: referrer } = await adminClient
      .from('loyalty_accounts')
      .select('customer_id, referral_code')
      .eq('referral_code', referralCode)
      .maybeSingle()

    if (!referrer) return { error: 'كود الإحالة غير موجود' }
    referrerId = referrer.customer_id
  }

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    app_metadata: { role: 'customer' },
    user_metadata: {
      full_name: fullName,
      phone,
      birth_date: data.birth_date || null,
    },
  })

  if (error) return { error: error.message }

  const userId = created.user?.id
  if (!userId) return { error: 'تعذّر إنشاء الحساب' }

  const birthDate = data.birth_date?.trim() || null
  if (birthDate) {
    await adminClient.from('profiles').update({ birth_date: birthDate }).eq('id', userId)
  }

  if (referralCode && referrerId) {
    if (referrerId === userId) return { error: 'لا يمكن استخدام كود نفس العميل' }

    await adminClient.rpc('ensure_loyalty_account', { p_customer: userId })
    const { error: accountError } = await adminClient
      .from('loyalty_accounts')
      .update({ referred_by: referrerId, updated_at: new Date().toISOString() })
      .eq('customer_id', userId)
    if (accountError) return { error: accountError.message }

    const { error: referralError } = await adminClient.from('referrals').insert({
      referrer_id: referrerId,
      referred_customer_id: userId,
      referral_code: referralCode,
      status: 'pending',
    })
    if (referralError) return { error: referralError.message }
  }

  return { success: true, userId }
}

export async function createEmployee(data: {
  full_name: string
  username: string
  password: string
}) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  const username = data.username.trim().toLowerCase()
  const fullName = data.full_name.trim()
  if (!fullName) return { error: 'الاسم مطلوب' }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return { error: 'اسم المستخدم يجب أن يكون 3-32 حرفاً إنجليزياً أو رقماً' }
  }
  const email = `${username}@internal.local`

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    app_metadata: { role: 'employee' },
    user_metadata: {
      full_name: fullName,
      username,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}
