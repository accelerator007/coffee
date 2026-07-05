export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Lang, t, brand } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
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

  // Display name comes from the JWT metadata — no profiles query needed.
  const fullName = user.user_metadata?.full_name as string | undefined

  const [kpisRes, byPackageRes, trendRes] = await Promise.all([
    supabase.rpc('admin_overview_kpis'),
    supabase.rpc('admin_subscriptions_by_package'),
    supabase.rpc('admin_redemptions_last_7_days'),
  ])

  const kpis = kpisRes.data?.[0] as {
    total_subscribers: number; active_subscribers: number; expired_subscribers: number;
    total_redemptions: number; avg_redemptions_per_subscriber: number; total_revenue: number;
  } | undefined
  const byPackage = byPackageRes.data ?? []
  const trend = trendRes.data ?? []

  const navLink = 'text-sm font-bold px-4 py-1.5 rounded-full transition-colors'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={fullName} lang={lang} />

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fade-up">
        {/* Title + nav */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-[28px] font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {t('dashboard', lang)}
              </h1>
              <p className="text-[13px] text-text-muted mt-0.5">{lang === 'ar' ? brand.shortLocationAr : brand.shortLocation}</p>
            </div>
            <Badge variant="neutral" dot>{lang === 'ar' ? brand.shortLocationAr : brand.shortLocation}</Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/create-user" className={`${navLink} text-foreground bg-muted hover:bg-border`}>
              {lang === 'ar' ? '+ حساب' : '+ Account'}
            </Link>
            <Link href="/admin/add-subscription" className={`${navLink} text-foreground bg-muted hover:bg-border`}>
              {lang === 'ar' ? '+ اشتراك' : '+ Subscribe'}
            </Link>
            <Link href="/admin/packages" className={`${navLink} text-foreground bg-muted hover:bg-border`}>
              {lang === 'ar' ? 'الباقات' : 'Packages'}
            </Link>
            <Link href="/admin/cards" className={`${navLink} text-foreground bg-muted hover:bg-border`}>
              {t('cards', lang)}
            </Link>
            <Link href="/admin/customers" className={`${navLink} text-background bg-brand hover:bg-brand-dark`}>
              {t('customers', lang)} ←
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        {kpis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard label={t('totalCustomers', lang)} value={kpis.total_subscribers} icon="users" />
            <KPICard label={t('activePlans', lang)} value={kpis.active_subscribers} icon="check" />
            <KPICard label={t('totalRedemptions', lang)} value={kpis.total_redemptions} icon="coffee" />
            <KPICard label={t('revenue', lang)} value={kpis.total_revenue} icon="wallet" prefix="OMR " decimals={3} />
          </div>
        )}

        {/* Weekly chart */}
        {trend.length > 0 && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-semibold text-foreground m-0" style={{ fontFamily: 'var(--font-display)' }}>{t('cupsPerDay', lang)}</h3>
              <Badge variant="accent">{t('thisWeek', lang)}</Badge>
            </div>
            <RedemptionChart data={trend} lang={lang} />
          </Card>
        )}

        {/* By Package */}
        {byPackage.length > 0 && (
          <Card>
            <h3 className="text-[18px] font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t('byPackage', lang)}</h3>
            <PackageTable data={byPackage} lang={lang} />
          </Card>
        )}
      </main>
    </div>
  )
}
