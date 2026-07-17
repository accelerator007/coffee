export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Coffee, MapPin, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserContext } from '@/lib/auth/roles'
import { Lang, t, brand } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import SubscriptionCard from '@/components/dashboard/SubscriptionCard'
import DailyAllowance from '@/components/dashboard/DailyAllowance'
import QRCodeDisplay from '@/components/dashboard/QRCode'
import HighlightsStrip from '@/components/dashboard/HighlightsStrip'
import LoyaltyRewards from '@/components/dashboard/LoyaltyRewards'
import Badge from '@/components/ui/Badge'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const currentUser = await getCurrentUserContext()
  if (!currentUser) redirect('/login')

  const supabase = await createClient()

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'
  const ar = lang === 'ar'

  const fullName = currentUser.fullName

  const { data: dashboardData } = await supabase.rpc('get_customer_dashboard').maybeSingle()
  const dashboard = dashboardData as {
    subscription: unknown | null
    loyalty: unknown | null
    offers: unknown[] | null
    notifications: unknown[] | null
    today_used: number | null
  } | null

  const subRaw = dashboard?.subscription ?? null
  const sub = subRaw as {
    id: string; package_id: string; package_name: string; tier: string | null;
    duration_days: number; daily_allowance: number;
    start_date: string; days_left: number; status: string;
  } | null
  const loyalty = dashboard?.loyalty as never
  const offers = (dashboard?.offers ?? []) as never[]
  const notifications = (dashboard?.notifications ?? []) as never[]
  const todayUsed = dashboard?.today_used ?? 0

  const code = `D7-${currentUser.id.slice(0, 4).toUpperCase()}-${currentUser.id.slice(-4).toUpperCase()}`

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardClient userName={fullName} lang={lang} />

      <main className="flex-1 max-w-md mx-auto w-full pb-8 animate-fade-up">
        {/* Welcome */}
        <div className="px-[18px] pt-5 pb-2">
          <p className="text-[13px] text-text-muted mb-0.5">{ar ? `${brand.nameAr}` : brand.tagline} · {t('welcomeBack', lang)}</p>
          <h1 className="text-[28px] font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {fullName || (ar ? 'ضيفنا' : 'Guest')}
          </h1>
        </div>

        {sub ? (
          <div className="flex flex-col gap-5 px-[18px] mt-3">
            {/* Plan */}
            <Card variant="warm">
              <SubscriptionCard
                packageName={sub.package_name}
                tier={sub.tier}
                daysLeft={sub.days_left}
                totalDays={sub.duration_days}
                startDate={sub.start_date}
                lang={lang}
              />
            </Card>

            {/* Daily cups */}
            <section>
              <SectionTitle icon={<Coffee size={17} strokeWidth={1.75} aria-hidden />}>{t('todaysCups', lang)}</SectionTitle>
              <Card>
                <DailyAllowance used={todayUsed} total={sub.daily_allowance} lang={lang} />
              </Card>
            </section>

            <LoyaltyRewards
              lang={lang}
              summary={loyalty}
              offers={offers}
              notifications={notifications}
            />

            {/* QR */}
            <Card variant="feature" className="text-center flex flex-col items-center">
              <QRCodeDisplay value={currentUser.id} />
              <p className="text-[15px] font-semibold text-foreground mt-4 mb-1">{t('scanToRedeem', lang)}</p>
              <p className="text-[13px] text-text-muted mb-3.5">{t('showToStaff', lang)}</p>
              <Badge variant="neutral">{code}</Badge>
            </Card>
          </div>
        ) : (
          <div className="px-[18px] mt-3">
            <Card className="text-center py-10">
              <Coffee size={48} strokeWidth={1.25} className="mx-auto mb-4 text-foreground opacity-70" aria-hidden />
              <p className="text-lg font-medium text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                {t('noSubscription', lang)}
              </p>
              <p className="text-text-muted text-sm mt-2">{t('contactToSubscribe', lang)}</p>
            </Card>
            <div className="mt-5">
              <LoyaltyRewards
                lang={lang}
                summary={loyalty}
                offers={offers}
                notifications={notifications}
              />
            </div>
          </div>
        )}

        {/* Feed */}
        <section className="mt-6">
          <SectionTitle icon={<Camera size={17} strokeWidth={1.75} aria-hidden />} className="px-[18px]">
            {t('fromOurFeed', lang)} · {brand.instagram}
          </SectionTitle>
          <HighlightsStrip />
        </section>

        {/* Location */}
        <div className="px-[18px] mt-3">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(brand.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-full font-bold text-[15px] bg-surface text-foreground ring-1 ring-inset ring-border hover:bg-muted transition-colors"
          >
            <MapPin size={18} strokeWidth={1.75} aria-hidden />
            {ar ? brand.locationAr : brand.location}
          </a>
        </div>
      </main>
    </div>
  )
}

function SectionTitle({ icon, children, className = '' }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-3 text-foreground ${className}`}>
      <span className="inline-flex">{icon}</span>
      <h3 className="text-[18px] font-semibold text-foreground m-0" style={{ fontFamily: 'var(--font-display)' }}>{children}</h3>
    </div>
  )
}
