export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import KPICard from '@/components/admin/KPICard'
import PackageTable from '@/components/admin/PackageTable'
import RedemptionChart from '@/components/admin/RedemptionChart'
import AdminPageClient from './AdminPageClient'

export default async function AdminPage() {
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

  const [kpisRes, byPackageRes, trendRes] = await Promise.all([
    supabase.rpc('admin_overview_kpis'),
    supabase.rpc('admin_subscriptions_by_package'),
    supabase.rpc('admin_redemptions_last_30_days'),
  ])

  const kpis = kpisRes.data?.[0]
  const byPackage = byPackageRes.data ?? []
  const trend = trendRes.data ?? []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={profile?.full_name} lang={lang} />

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand">{t('dashboard', lang)}</h1>
          <div className="flex gap-4">
            <Link href="/admin/create-user" className="text-sm text-brand underline">
              {lang === 'ar' ? '+ حساب' : '+ Account'}
            </Link>
            <Link href="/admin/add-subscription" className="text-sm text-brand underline">
              {lang === 'ar' ? '+ اشتراك' : '+ Subscribe'}
            </Link>
            <Link href="/admin/customers" className="text-sm text-brand underline">
              {t('customers', lang)} ←
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        {kpis && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPICard label={t('totalSubscribers', lang)} value={kpis.total_subscribers} icon="👥" />
            <KPICard label={t('activeSubscribers', lang)} value={kpis.active_subscribers} icon="✅" color="text-green-700" />
            <KPICard label={t('expiredSubscribers', lang)} value={kpis.expired_subscribers} icon="⏰" color="text-red-600" />
            <KPICard label={t('totalRedemptions', lang)} value={kpis.total_redemptions} icon="☕" />
          </div>
        )}

        {/* Trend Chart */}
        {trend.length > 0 && (
          <Card>
            <RedemptionChart data={trend} lang={lang} />
          </Card>
        )}

        {/* By Package */}
        {byPackage.length > 0 && (
          <Card>
            <h3 className="font-medium text-foreground mb-4">{t('byPackage', lang)}</h3>
            <PackageTable data={byPackage} lang={lang} />
          </Card>
        )}
      </main>
    </div>
  )
}
