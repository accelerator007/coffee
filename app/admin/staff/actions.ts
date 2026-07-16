'use server'

import { adminClient } from '@/lib/supabase/admin'
import { hasCurrentUserRole } from '@/lib/auth/roles'

export type AppRole = 'admin' | 'employee' | 'customer'

export type UserRow = {
  id: string
  email: string | null
  full_name: string
  role: AppRole
  phone: string | null
  username: string | null
}

const ROLES: AppRole[] = ['admin', 'employee', 'customer']

/**
 * Role changes touch the service-role client (bypasses RLS), and server actions
 * can be invoked directly — so verify the caller is an admin against their own
 * RLS-scoped session before doing anything privileged.
 */
async function isCallerAdmin(): Promise<boolean> {
  return hasCurrentUserRole('admin')
}

export async function listUsers(): Promise<UserRow[]> {
  if (!(await isCallerAdmin())) return []

  const [authRes, profilesRes] = await Promise.all([
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    adminClient.from('profiles').select('id, role, full_name, phone, username'),
  ])

  type ProfileRow = { id: string; role: AppRole; full_name: string; phone: string | null; username: string | null }
  const byId = new Map<string, ProfileRow>((profilesRes.data ?? []).map(p => [p.id, p as ProfileRow]))

  const rows: UserRow[] = (authRes.data?.users ?? []).map(u => {
    const p = byId.get(u.id)
    // The middleware authorizes from app_metadata.role (trusted, server-set);
    // is_admin()/RLS read profiles.role. Prefer profiles, then app_metadata.
    const appRole = u.app_metadata?.role as AppRole | undefined
    const metaName = u.user_metadata?.full_name as string | undefined
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: p?.full_name || metaName || '',
      role: (p?.role ?? appRole ?? 'customer'),
      phone: p?.phone ?? null,
      username: p?.username ?? null,
    }
  })

  const order: Record<AppRole, number> = { admin: 0, employee: 1, customer: 2 }
  rows.sort((a, b) => order[a.role] - order[b.role] || a.full_name.localeCompare(b.full_name, 'ar'))
  return rows
}

export async function setUserRole(userId: string, role: AppRole) {
  if (!(await isCallerAdmin())) return { error: 'not_authorized' as const }
  if (!ROLES.includes(role)) return { error: 'bad_role' as const }

  // Keep both stores in sync: the middleware authorizes from app_metadata.role
  // (server-controlled, users can't edit it), while is_admin()/RLS read
  // profiles.role. Merge app_metadata (fetch first) so provider info isn't lost.
  const { data: current, error: getError } = await adminClient.auth.admin.getUserById(userId)
  if (getError) return { error: getError.message }

  const appMeta = { ...(current.user?.app_metadata ?? {}), role }
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, { app_metadata: appMeta })
  if (authError) return { error: authError.message }

  // Update the existing profile's role only; insert (with a name) if missing so
  // the row is never left without the not-null full_name.
  const { data: existing } = await adminClient.from('profiles').select('id').eq('id', userId).maybeSingle()
  const { error: profileError } = existing
    ? await adminClient.from('profiles').update({ role }).eq('id', userId)
    : await adminClient.from('profiles').insert({
        id: userId,
        role,
        full_name: (current.user?.user_metadata?.full_name as string | undefined) ?? '',
      })
  if (profileError) return { error: profileError.message }

  return { success: true }
}
