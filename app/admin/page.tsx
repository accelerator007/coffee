export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, CircleCheck, Clock, Coffee } from 'lucide-react'
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
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-black text-brand">{t('dashboard', lang)}</h1>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/create-user" className="text-sm text-brand bg-muted hover:bg-border px-4 py-1.5 rounded-full transition-colors font-medium">
              {lang === 'ar' ? '+ حساب' : '+ Account'}
            </Link>
            <Link href="/admin/add-subscription" className="text-sm text-brand bg-muted hover:bg-border px-4 py-1.5 rounded-full transition-colors font-medium">
              {lang === 'ar' ? '+ اشتراك' : '+ Subscribe'}
            </Link>
            <Link href="/admin/packages" className="text-sm text-brand bg-muted hover:bg-border px-4 py-1.5 rounded-full transition-colors font-medium">
              {lang === 'ar' ? 'الباقات' : 'Packages'}
            </Link>
            <Link href="/admin/customers" className="text-sm text-background bg-brand hover:bg-brand-dark px-4 py-1.5 rounded-full transition-colors font-medium">
              {t('customers', lang)} ←
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        {kpis && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
            <KPICard label={t('totalSubscribers', lang)} value={kpis.total_subscribers} icon={Users} />
            <KPICard label={t('activeSubscribers', lang)} value={kpis.active_subscribers} icon={CircleCheck} color="text-success" />
            <KPICard label={t('expiredSubscribers', lang)} value={kpis.expired_subscribers} icon={Clock} color="text-danger" />
            <KPICard label={t('totalRedemptions', lang)} value={kpis.total_redemptions} icon={Coffee} />
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
