export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Lang, t } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import CardsClient from './CardsClient'
import { listCards } from './actions'
import { getCustomers } from '../add-subscription/actions'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  // Display name comes from the JWT metadata — no profiles query needed.
  const fullName = user.user_metadata?.full_name as string | undefined

  const [cards, customers] = await Promise.all([listCards(), getCustomers()])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={fullName} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
            ← {t('dashboard', lang)}
          </Link>
          <h1 className="text-2xl font-black text-brand">{t('cards', lang)}</h1>
        </div>
        <CardsClient lang={lang} cards={cards} customers={customers} />
      </main>
    </div>
  )
}
