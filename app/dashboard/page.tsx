export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('customer_id', user.id)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  let todayUsed = 0
  if (subscription) {
    const today = getMuscatDate()
    const { count } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscription.id)
      .eq('day', today)
    todayUsed = count ?? 0
  }

  const today = getMuscatDate()
  const daysLeft = subscription
    ? subscription.duration_days - Math.floor(
        (new Date(today).getTime() - new Date(subscription.start_date).getTime()) / 86400000
      )
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardClient
        userName={profile?.full_name}
        lang={lang}
      />

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-4">
        {subscription ? (
          <>
            <Card>
              <SubscriptionCard
                packageName={(subscription.packages as { name: string }).name}
                daysLeft={daysLeft}
                totalDays={subscription.duration_days}
                lang={lang}
              />
            </Card>

            <Card>
              <DailyAllowance
                used={todayUsed}
                total={(subscription.packages as { daily_allowance: number }).daily_allowance}
                lang={lang}
              />
            </Card>

            <Card>
              <h3 className="font-medium text-foreground text-center mb-2">
                {lang === 'ar' ? 'رمز QR الخاص بي' : 'My QR Code'}
              </h3>
              <QRCodeDisplay value={user.id} />
              <p className="text-xs text-text-muted text-center mt-1">
                {lang === 'ar' ? 'اعرضه للموظف لتسجيل كوبك' : 'Show to staff to redeem your cup'}
              </p>
            </Card>
          </>
        ) : (
          <Card className="text-center py-10">
            <div className="text-5xl mb-4">☕</div>
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
