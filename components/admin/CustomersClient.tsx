'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { searchCustomers } from '@/app/admin/customers/actions'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ListRow from '@/components/ui/ListRow'

type CustomerRow = Awaited<ReturnType<typeof searchCustomers>>[number]

export default function CustomersClient({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const result = await searchCustomers(q)
    setData(result)
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
        <h1 className="text-2xl font-black text-brand">{t('customers', lang)}</h1>
      </div>

      <div className="relative">
        <span className="absolute top-1/2 -translate-y-1/2 start-4 text-text-muted text-sm">🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchCustomers', lang)}
          className="w-full min-h-12 ps-10 pe-4 rounded-full border border-border bg-surface text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/20 focus:border-brand"
          autoFocus
        />
        {loading && (
          <span className="absolute top-1/2 -translate-y-1/2 end-4 inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {!loading && data.length === 0 ? (
        <Card className="text-center text-text-muted py-10">
          <div className="text-4xl mb-2">🔍</div>
          {lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}
        </Card>
      ) : (
        <Card className="py-1 animate-fade-up">
          <div className="divide-y divide-border/60">
            {data.map(row => (
              <ListRow
                key={row.id}
                thumb={(row.full_name?.trim()?.[0] ?? '?').toUpperCase()}
                title={row.full_name || '—'}
                subtitle={
                  <span className="flex items-center gap-2">
                    <span dir="ltr" className="font-mono text-xs">{row.phone ?? '—'}</span>
                    {row.package_name
                      ? <span>· {row.package_name}</span>
                      : <span className="opacity-70">· {lang === 'ar' ? 'بدون اشتراك' : 'No subscription'}</span>
                    }
                  </span>
                }
                trailing={
                  <div className="flex flex-col items-end gap-1">
                    {row.status
                      ? <Badge status={row.status} label={t(row.status, lang)} />
                      : <span className="text-text-muted text-xs">—</span>
                    }
                    {row.days_left != null && (
                      <span className="text-xs text-text-muted">
                        {Math.max(0, row.days_left)} {lang === 'ar' ? 'يوم' : 'days'}
                      </span>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
