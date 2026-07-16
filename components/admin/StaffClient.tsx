'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ShieldCheck } from 'lucide-react'
import { listUsers, setUserRole, type UserRow, type AppRole } from '@/app/admin/staff/actions'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ListRow from '@/components/ui/ListRow'
import SegmentedTabs from '@/components/ui/SegmentedTabs'

const roleVariant: Record<AppRole, 'brand' | 'accent' | 'neutral'> = {
  admin: 'brand',
  employee: 'accent',
  customer: 'neutral',
}

const roleKey: Record<AppRole, 'roleAdmin' | 'roleEmployee' | 'roleCustomer'> = {
  admin: 'roleAdmin',
  employee: 'roleEmployee',
  customer: 'roleCustomer',
}

type Filter = 'all' | AppRole

export default function StaffClient({ lang }: { lang: Lang }) {
  const ar = lang === 'ar'
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await listUsers()
    setUsers(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Deferred so the loading flag isn't set synchronously inside the effect.
    const id = setTimeout(load, 0)
    return () => clearTimeout(id)
  }, [load])

  function localizeError(code: string) {
    if (code === 'not_authorized') return t('notAuthorized', lang)
    return code || t('error', lang)
  }

  async function changeRole(id: string, role: AppRole) {
    const prev = users.find(u => u.id === id)?.role
    if (!prev || prev === role) return
    setError('')
    setSavingId(id)
    // Optimistic; revert on failure.
    setUsers(us => us.map(u => (u.id === id ? { ...u, role } : u)))
    const res = await setUserRole(id, role)
    setSavingId(null)
    if ('error' in res && res.error) {
      setUsers(us => us.map(u => (u.id === id ? { ...u, role: prev } : u)))
      setError(localizeError(res.error))
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = users.filter(u => {
    if (filter !== 'all' && u.role !== filter) return false
    if (!q) return true
    return (
      u.full_name.toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.phone ?? '').toLowerCase().includes(q)
    )
  })

  const selectClass = `min-h-11 px-3 rounded-2xl border border-border bg-surface text-foreground text-sm
    focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand`

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
          ← {t('dashboard', lang)}
        </Link>
        <h1 className="text-2xl font-black text-brand inline-flex items-center gap-2">
          <ShieldCheck size={22} strokeWidth={2} aria-hidden />
          {t('staffTitle', lang)}
        </h1>
      </div>

      <SegmentedTabs
        block
        value={filter}
        onChange={v => setFilter(v as Filter)}
        tabs={[
          { value: 'all', label: ar ? 'الكل' : 'All' },
          { value: 'admin', label: t('roleAdmin', lang) },
          { value: 'employee', label: t('roleEmployee', lang) },
          { value: 'customer', label: t('roleCustomer', lang) },
        ]}
      />

      <div className="relative">
        <span className="absolute top-1/2 -translate-y-1/2 start-4 text-text-muted">
          <Search size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchStaff', lang)}
          aria-label={t('searchStaff', lang)}
          className="w-full min-h-12 ps-11 pe-4 rounded-full border border-border bg-surface text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
        {loading && (
          <span className="absolute top-1/2 -translate-y-1/2 end-4 inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {!loading && filtered.length === 0 ? (
        <Card className="text-center text-text-muted py-10">
          <Search size={36} strokeWidth={1.5} className="mx-auto mb-2 opacity-60" aria-hidden />
          {ar ? 'لا توجد نتائج' : 'No results found'}
        </Card>
      ) : filtered.length > 0 && (
        <Card className="py-1 animate-fade-up">
          <div className="divide-y divide-border/60">
            {filtered.map(u => (
              <ListRow
                key={u.id}
                thumb={(u.full_name?.trim()?.[0] ?? u.email?.[0] ?? u.username?.[0] ?? '?').toUpperCase()}
                title={u.full_name || u.email?.split('@')[0] || u.username || u.phone || '—'}
                subtitle={
                  <span dir="ltr" className="font-mono text-xs">
                    {u.email || u.username || u.phone || '—'}
                  </span>
                }
                trailing={
                  <div className="flex items-center gap-2">
                    <Badge variant={roleVariant[u.role]}>{t(roleKey[u.role], lang)}</Badge>
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={e => changeRole(u.id, e.target.value as AppRole)}
                      aria-label={t('roleLabel', lang)}
                      className={selectClass}
                    >
                      <option value="admin">{t('roleAdmin', lang)}</option>
                      <option value="employee">{t('roleEmployee', lang)}</option>
                      <option value="customer">{t('roleCustomer', lang)}</option>
                    </select>
                  </div>
                }
              />
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-text-muted">
        {ar
          ? 'تغيير الصلاحية يسري عند تسجيل الدخول القادم للمستخدم.'
          : 'A role change takes effect on the user’s next sign-in.'}
      </p>
    </>
  )
}
