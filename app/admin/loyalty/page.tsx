export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserContext } from '@/lib/auth/roles'
import { Lang } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import LoyaltyClient from './LoyaltyClient'

export default async function LoyaltyPage() {
  const currentUser = await getCurrentUserContext()
  if (!currentUser) redirect('/login')

  const supabase = await createClient()

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'
  const fullName = currentUser.fullName

  const { data: dashboardData } = await supabase.rpc('admin_loyalty_dashboard').maybeSingle()
  const dashboard = dashboardData as {
    settings?: unknown
    tiers?: unknown[]
    offers?: unknown[]
    double_days?: unknown[]
    customers?: unknown[]
    transactions?: unknown[]
    kpis?: unknown
  } | null

  const settings = dashboard?.settings ?? { points_per_redemption: 10, referred_customer_points: 50 }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={fullName} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
        <LoyaltyClient
          lang={lang}
          settings={settings as never}
          tiers={(dashboard?.tiers ?? []) as never}
          offers={(dashboard?.offers ?? []) as never}
          doubleDays={(dashboard?.double_days ?? []) as never}
          customers={(dashboard?.customers ?? []) as never}
          transactions={(dashboard?.transactions ?? []) as never}
          kpis={dashboard?.kpis as never}
        />
      </main>
    </div>
  )
}
