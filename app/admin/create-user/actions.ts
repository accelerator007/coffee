'use server'

import { adminClient } from '@/lib/supabase/admin'

export async function createCustomer(data: {
  full_name: string
  phone: string
  password: string
}) {
  const phone = data.phone.startsWith('+') ? data.phone : `+968${data.phone.replace(/^0/, '')}`
  const email = `${phone}@phone.local`

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      role: 'customer',
      full_name: data.full_name,
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
  const email = `${data.username}@internal.local`

  const { error } = await adminClient.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      role: 'employee',
      full_name: data.full_name,
      username: data.username,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}
