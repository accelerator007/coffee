'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { hasCurrentUserRole } from '@/lib/auth/roles'
import { normalizeOmanPhone, phoneAuthEmail } from '@/lib/phone'

function maintenanceError(message: string) {
  if (message.includes('profile_phone_exists')) return 'رقم الهاتف مستخدم من عميل آخر'
  if (message.includes('auth_user_email_exists')) return 'رقم الهاتف مستخدم من حساب آخر'
  if (message.includes('auth_user_not_found')) return 'حساب الدخول غير موجود لهذا العميل'
  if (message.includes('full_name_required')) return 'الاسم مطلوب'
  if (message.includes('invalid_email')) return 'بيانات الدخول غير صحيحة'
  return message
}

export async function updateCustomer(
  id: string,
  data: { full_name: string; phone: string; birth_date?: string | null }
) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  const normalized = normalizeOmanPhone(data.phone)
  if (!normalized.ok) return { error: 'رقم الهاتف غير صحيح' }
  const phone = normalized.international
  const full_name = data.full_name.trim()

  if (!full_name) return { error: 'الاسم مطلوب' }

  const { error } = await adminClient.rpc('admin_update_customer_auth_user', {
    p_user: id,
    p_email: phoneAuthEmail(normalized.local),
    p_full_name: full_name,
    p_phone: phone,
    p_birth_date: data.birth_date || null,
  })

  if (error) return { error: maintenanceError(error.message) }
  return { success: true }
}

export async function deleteCustomer(id: string) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  const { error } = await adminClient.rpc('admin_delete_auth_user', { p_user: id })
  if (error) return { error: maintenanceError(error.message) }
  return { success: true }
}

export async function searchCustomers(q: string) {
  if (!(await hasCurrentUserRole('admin'))) return []

  const supabase = await createClient()
  const { data } = await supabase.rpc('admin_customer_search', { search: q || null })

  type CustomerSearchRow = {
    id: string
    full_name: string
    phone: string | null
    birth_date: string | null
    points_balance: number | null
    lifetime_points: number | null
    referral_code: string | null
    package_name: string | null
    tier: string | null
    status: string | null
    days_left: number | null
    times_used: number | null
  }

  return ((data ?? []) as CustomerSearchRow[]).map(row => ({
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    birth_date: row.birth_date ?? null,
    points_balance: row.points_balance ?? 0,
    lifetime_points: row.lifetime_points ?? 0,
    referral_code: row.referral_code ?? null,
    package_name: row.package_name ?? null,
    tier: row.tier ?? null,
    status: (row.status ?? null) as 'active' | 'expired' | null,
    days_left: row.days_left ?? null,
    times_used: row.times_used ?? 0,
  }))
}
