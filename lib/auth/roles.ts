import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type AppRole = 'admin' | 'employee' | 'customer'

const APP_ROLES: AppRole[] = ['admin', 'employee', 'customer']

export type CurrentUserContext = {
  id: string
  role: AppRole
  fullName?: string
}

export function isAppRole(value: unknown): value is AppRole {
  return APP_ROLES.includes(value as AppRole)
}

/**
 * Resolve the signed-in user's trusted context from JWT claims. Using claims
 * avoids a Server Component redirect loop caused by auth.getUser() attempting
 * session refresh/cookie writes during page rendering.
 */
export const getCurrentUserContext = cache(async (): Promise<CurrentUserContext | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims || typeof claims.sub !== 'string') return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', claims.sub)
    .maybeSingle()

  // If the signed token outlives a deleted profile/auth row, treat it as
  // unauthorized immediately instead of trusting stale JWT metadata.
  if (!profile && !profileError) return null

  let role: AppRole | null = null
  if (isAppRole(profile?.role)) role = profile.role

  if (!role && profileError) {
    const metadataRole = (claims.app_metadata as { role?: unknown } | undefined)?.role
    if (isAppRole(metadataRole)) role = metadataRole
  }

  if (!role) return null

  const metadataName = (claims.user_metadata as { full_name?: unknown } | undefined)?.full_name
  return {
    id: claims.sub,
    role,
    fullName: profile?.full_name || (typeof metadataName === 'string' ? metadataName : undefined),
  }
})

export async function getCurrentUserRole(): Promise<AppRole | null> {
  return (await getCurrentUserContext())?.role ?? null
}

export async function hasCurrentUserRole(...allowed: AppRole[]): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role !== null && allowed.includes(role)
}
