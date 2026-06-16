export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Coffee } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Lang } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'
import SubscriptionCard from '@/components/dashboard/SubscriptionCard'
import DailyAllowance from '@/components/dashboard/DailyAllowance'
import QRCodeDisplay from '@/components/dashboard/QRCode'
import DashboardClient from './DashboardClient'

function getMuscatDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  // Fetch profile and subscription in parallel (subscription days_left is
  // computed in SQL with Asia/Muscat timezone to avoid JS date math bugs).
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.rpc('get_my_subscription').maybeSingle(),
  ])
  const profile = profileRes.data
  const subRaw = subRes.data
  const sub = subRaw as {
    id: string; package_id: string; package_name: string;
    duration_days: number; daily_allowance: number;
    start_date: string; days_left: number; status: string;
  } | null

  let todayUsed = 0
  if (sub) {
    const today = getMuscatDate()
    const { count } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', sub.id)
      .eq('day', today)
    todayUsed = count ?? 0
  }

  const subscription = sub
  const daysLeft = sub?.days_left ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardClient
        userName={profile?.full_name}
        lang={lang}
      />

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-5 animate-fade-up">
        {subscription ? (
          <>
            <Card>
              <SubscriptionCard
                packageName={subscription.package_name}
                daysLeft={daysLeft}
                totalDays={subscription.duration_days}
                lang={lang}
              />
            </Card>

            <Card>
              <DailyAllowance
                used={todayUsed}
                total={subscription.daily_allowance}
                lang={lang}
              />
            </Card>

            <Card className="flex flex-col items-center text-center">
              <p className="text-xs font-semibold tracking-widest text-latte uppercase mb-1">
                {lang === 'ar' ? 'رمزي' : 'My Code'}
              </p>
              <h3 className="font-black text-lg text-foreground mb-3">
                {lang === 'ar' ? 'رمز QR الخاص بي' : 'My QR Code'}
              </h3>
              <div className="rounded-2xl bg-background p-3 border border-border">
                <QRCodeDisplay value={user.id} />
              </div>
              <p className="text-xs text-text-muted mt-3">
                {lang === 'ar' ? 'اعرضه للموظف لتسجيل كوبك' : 'Show to staff to redeem your cup'}
              </p>
            </Card>
          </>
        ) : (
          <Card className="text-center py-10">
            <Coffee size={48} strokeWidth={1.5} className="mx-auto mb-4 text-brand opacity-70" aria-hidden />
            <p className="text-lg font-medium text-foreground">
              {lang === 'ar' ? 'لا يوجد اشتراك نشط' : 'No active subscription'}
            </p>
            <p className="text-text-muted text-sm mt-2">
              {lang === 'ar' ? 'تواصل معنا للاشتراك' : 'Contact us to subscribe'}
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
