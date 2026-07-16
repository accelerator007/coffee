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

  const { data, error } = await adminClient.rpc('admin_list_app_users')
  if (error) return []

  type DbUserRow = {
    id: string
    email: string | null
    full_name: string | null
    role: string | null
    phone: string | null
    username: string | null
  }

  const rows: UserRow[] = ((data ?? []) as DbUserRow[]).map(u => {
    const role = ROLES.includes(u.role as AppRole) ? (u.role as AppRole) : 'customer'
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: u.full_name || '',
      role,
      phone: u.phone ?? null,
      username: u.username ?? null,
    }
  })

  const order: Record<AppRole, number> = { admin: 0, employee: 1, customer: 2 }
  rows.sort((a, b) => order[a.role] - order[b.role] || a.full_name.localeCompare(b.full_name, 'ar'))
  return rows
}

export async function setUserRole(userId: string, role: AppRole) {
  if (!(await isCallerAdmin())) return { error: 'not_authorized' as const }
  if (!ROLES.includes(role)) return { error: 'bad_role' as const }

  const { error } = await adminClient.rpc('admin_set_user_role', {
    p_user: userId,
    p_role: role,
  })

  if (error) return { error: error.message }

  return { success: true }
}
