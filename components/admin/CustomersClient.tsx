'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import CustomerTable from '@/components/admin/CustomerTable'

interface CustomerRow {
  customer_id: string
  full_name: string
  phone: string
  package_name: string
  status: 'active' | 'expired'
  days_left: number
  times_used: number
}

export default function CustomersClient({ lang, initialData }: { lang: Lang; initialData: CustomerRow[] }) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<CustomerRow[]>(initialData)
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('admin_customer_detail', { search: q || null })
    setData(data ?? [])
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
        <CustomerTable data={data} lang={lang} />
      </Card>
    </>
  )
}
