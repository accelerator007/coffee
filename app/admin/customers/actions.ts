'use server'

import { createClient } from '@/lib/supabase/server'

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
      package_name?: string; status?: string; days_left?: number; times_used?: number
    } | undefined
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      package_name: rpc?.package_name ?? null,
      status: (rpc?.status ?? null) as 'active' | 'expired' | null,
      days_left: rpc?.days_left ?? null,
      times_used: rpc?.times_used ?? null,
    }
  })
}
