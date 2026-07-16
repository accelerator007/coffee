import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type AppRole = 'admin' | 'employee' | 'customer'

const APP_ROLES: AppRole[] = ['admin', 'employee', 'customer']

export function isAppRole(value: unknown): value is AppRole {
  return APP_ROLES.includes(value as AppRole)
}

/**
 * Resolve the signed-in user's trusted role. profiles is protected by RLS and
 * reflects role changes immediately; app_metadata is the signed-token fallback.
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (isAppRole(profile?.role)) return profile.role

  const metadataRole = user.app_metadata?.role
  return isAppRole(metadataRole) ? metadataRole : null
}

export async function hasCurrentUserRole(...allowed: AppRole[]): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role !== null && allowed.includes(role)
}
