'use server'

import { adminClient } from '@/lib/supabase/admin'
import { hasCurrentUserRole } from '@/lib/auth/roles'
import { normalizeOmanPhone } from '@/lib/phone'

export async function createCustomer(data: {
  full_name: string
  phone: string
  password: string
}) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  const normalized = normalizeOmanPhone(data.phone)
  if (!normalized.ok) return { error: 'رقم الهاتف غير صحيح' }
  const fullName = data.full_name.trim()
  if (!fullName) return { error: 'الاسم مطلوب' }
  const phone = normalized.international
  const email = `${phone}@phone.local`

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    app_metadata: { role: 'customer' },
    user_metadata: {
      full_name: fullName,
      phone,
    },
  })

  if (error) return { error: error.message }
  return { success: true, userId: created.user?.id }
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
