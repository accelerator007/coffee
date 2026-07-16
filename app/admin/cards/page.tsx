export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getCurrentUserContext } from '@/lib/auth/roles'
import { Lang, t } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import CardsClient from './CardsClient'
import { listCards } from './actions'
import { getCustomers } from '../add-subscription/actions'

export default async function CardsPage() {
  const currentUser = await getCurrentUserContext()
  if (!currentUser) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  const [cards, customers] = await Promise.all([listCards(), getCustomers()])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={currentUser.fullName} lang={lang} />
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
