'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { hasCurrentUserRole } from '@/lib/auth/roles'
import { normalizeOmanPhone } from '@/lib/phone'

export async function updateCustomer(
  id: string,
  data: { full_name: string; phone: string }
) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  const normalized = normalizeOmanPhone(data.phone)
  if (!normalized.ok) return { error: 'رقم الهاتف غير صحيح' }
  const phone = normalized.international
  const full_name = data.full_name.trim()

  if (!full_name) return { error: 'الاسم مطلوب' }

  // Update the profile row
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', id)

  if (profileError) return { error: profileError.message }

  // Keep the auth user (login email + metadata) in sync with the new phone
  const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
    email: `${phone}@phone.local`,
    app_metadata: { role: 'customer' },
    user_metadata: { full_name, phone },
  })

  if (authError) return { error: authError.message }
  return { success: true }
}

export async function deleteCustomer(id: string) {
  if (!(await hasCurrentUserRole('admin'))) return { error: 'not_authorized' }

  // Deleting the auth user cascades to the profile (and its subscriptions/redemptions)
  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function searchCustomers(q: string) {
  const supabase = await createClient()

  // Get all customers from profiles directly
  let profileQuery = supabase
    .from('profiles')
    .select('id, full_name, phone, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (q) {
    profileQuery = profileQuery.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: profiles } = await profileQuery

  // Enrich with subscription data from RPC
  const { data: rpcData } = await supabase.rpc('admin_customer_detail', { search: q || null })
  const rpcMap = new Map((rpcData ?? []).map((r: { customer_id: string }) => [r.customer_id, r]))

  return (profiles ?? []).map((p) => {
    const rpc = rpcMap.get(p.id) as {
      package_name?: string; tier?: string | null; status?: string; days_left?: number; times_used?: number
    } | undefined
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      package_name: rpc?.package_name ?? null,
      tier: rpc?.tier ?? null,
      status: (rpc?.status ?? null) as 'active' | 'expired' | null,
      days_left: rpc?.days_left ?? null,
      times_used: rpc?.times_used ?? null,
    }
  })
}
