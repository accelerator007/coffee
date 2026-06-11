export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import CustomerTable from '@/components/admin/CustomerTable'
import AdminPageClient from '../AdminPageClient'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { q } = await searchParams
  const { data } = await supabase.rpc('admin_customer_detail', { search: q ?? null })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={profile?.full_name} lang={lang} />

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
            ← {t('dashboard', lang)}
          </Link>
          <h1 className="text-xl font-bold text-brand">{t('customers', lang)}</h1>
        </div>

        {/* Search */}
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder={t('searchCustomers', lang)}
            className="flex-1 min-h-11 px-4 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          <button
            type="submit"
            className="min-h-11 px-5 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition-colors"
          >
            {t('search', lang)}
          </button>
        </form>

        <Card className="p-0 overflow-hidden">
          <CustomerTable data={data ?? []} lang={lang} />
        </Card>
      </main>
    </div>
  )
}
