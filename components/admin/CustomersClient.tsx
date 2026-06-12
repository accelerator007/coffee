'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface CustomerRow {
  id: string
  full_name: string
  phone: string
  created_at: string
  // from subscription join
  package_name?: string
  status?: 'active' | 'expired'
  days_left?: number
  times_used?: number
}

export default function CustomersClient({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const supabase = createClient()

    // First try the RPC for customers with subscriptions
    const { data: rpcData } = await supabase.rpc('admin_customer_detail', { search: q || null })

    // Also get ALL customers from profiles directly
    let profileQuery = supabase
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (q) {
      profileQuery = profileQuery.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    }

    const { data: profiles } = await profileQuery

    // Merge: start with all profiles, enrich with RPC data if available
    const rpcMap = new Map((rpcData ?? []).map((r: { customer_id: string }) => [r.customer_id, r]))

    const merged: CustomerRow[] = (profiles ?? []).map((p) => {
      const rpc = rpcMap.get(p.id) as { package_name?: string; status?: string; days_left?: number; times_used?: number } | undefined
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        created_at: p.created_at,
        package_name: rpc?.package_name,
        status: rpc?.status as 'active' | 'expired' | undefined,
        days_left: rpc?.days_left,
        times_used: rpc?.times_used,
      }
    })

    setData(merged)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
          ← {t('dashboard', lang)}
        </Link>
        <h1 className="text-xl font-bold text-brand">{t('customers', lang)}</h1>
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchCustomers', lang)}
          className="w-full min-h-11 px-4 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          autoFocus
        />
        {loading && (
          <span className="absolute top-3 left-4 inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {data.length === 0 && !loading ? (
          <p className="text-center text-text-muted py-8">
            {lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 px-3 font-medium text-text-muted">{t('name', lang)}</th>
                  <th className="text-start py-2 px-3 font-medium text-text-muted">{t('phone', lang)}</th>
                  <th className="text-start py-2 px-3 font-medium text-text-muted">{t('packageName', lang)}</th>
                  <th className="text-start py-2 px-3 font-medium text-text-muted">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-start py-2 px-3 font-medium text-text-muted">{t('daysLeft', lang)}</th>
                  <th className="text-start py-2 px-3 font-medium text-text-muted">{t('timesUsed', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-3 font-medium">{row.full_name || '—'}</td>
                    <td className="py-3 px-3 font-mono text-xs" dir="ltr">{row.phone ?? '—'}</td>
                    <td className="py-3 px-3">{row.package_name ?? <span className="text-text-muted text-xs">{lang === 'ar' ? 'بدون اشتراك' : 'No subscription'}</span>}</td>
                    <td className="py-3 px-3">
                      {row.status
                        ? <Badge status={row.status} label={t(row.status, lang)} />
                        : <span className="text-text-muted text-xs">—</span>
                      }
                    </td>
                    <td className="py-3 px-3">{row.days_left != null ? Math.max(0, row.days_left) : '—'}</td>
                    <td className="py-3 px-3 font-semibold text-brand">{row.times_used ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
