export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Lang } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import LoyaltyClient from './LoyaltyClient'

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'
  const fullName = user.user_metadata?.full_name as string | undefined

  const [
    settingsRes,
    tiersRes,
    offersRes,
    doubleDaysRes,
    customersRes,
    transactionsRes,
    kpisRes,
  ] = await Promise.all([
    supabase
      .from('loyalty_settings')
      .select('points_per_redemption, referred_customer_points')
      .eq('id', true)
      .maybeSingle(),
    supabase
      .from('loyalty_tiers')
      .select('slug, name_ar, name_en, min_points, points_multiplier, birthday_points, referral_points, is_active')
      .order('sort_order'),
    supabase
      .from('offers')
      .select('id, title_ar, title_en, body_ar, body_en, badge_ar, badge_en, starts_at, ends_at, is_active, target_tier, points_cost, reward_points, sort_order, created_at')
      .order('sort_order')
      .order('created_at', { ascending: false }),
    supabase
      .from('double_point_days')
      .select('id, title_ar, title_en, day, multiplier, is_active')
      .order('day', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, phone, loyalty_accounts(points_balance, lifetime_points, referral_code)')
      .eq('role', 'customer')
      .order('full_name'),
    supabase
      .from('loyalty_transactions')
      .select('id, points, type, description, created_at, profiles!customer_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.rpc('admin_loyalty_kpis'),
  ])

  const settings = settingsRes.data ?? { points_per_redemption: 10, referred_customer_points: 50 }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={fullName} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
        <LoyaltyClient
          lang={lang}
          settings={settings}
          tiers={(tiersRes.data ?? []) as never}
          offers={(offersRes.data ?? []) as never}
          doubleDays={(doubleDaysRes.data ?? []) as never}
          customers={(customersRes.data ?? []) as never}
          transactions={(transactionsRes.data ?? []) as never}
          kpis={kpisRes.data?.[0] as never}
        />
      </main>
    </div>
  )
}
