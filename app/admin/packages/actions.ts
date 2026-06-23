'use server'

import { createClient } from '@/lib/supabase/server'

export type Tier = 'gold' | 'silver' | 'bronze'

export type PackageInput = {
  name: string
  duration_days: number
  daily_allowance: number
  price: number
  tier: Tier | null
}

export async function listPackages() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('packages')
    .select('id, name, duration_days, daily_allowance, price, tier')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createPackage(input: PackageInput) {
  const supabase = await createClient()
  const { error } = await supabase.from('packages').insert({
    name: input.name,
    duration_days: input.duration_days,
    daily_allowance: input.daily_allowance,
    price: input.price,
    tier: input.tier,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePackage(id: string, input: PackageInput) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('packages')
    .update({
      name: input.name,
      duration_days: input.duration_days,
      daily_allowance: input.daily_allowance,
      price: input.price,
      tier: input.tier,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
