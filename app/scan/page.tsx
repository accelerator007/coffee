export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Lang, t } from '@/lib/i18n'
import Header from '@/components/layout/Header'
import ScanClient from '@/components/scan/ScanClient'
import ScanPageClient from './ScanPageClient'

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  // Display name comes from the JWT metadata — no profiles query needed.
  const fullName = user.user_metadata?.full_name as string | undefined

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScanPageClient userName={fullName} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-4">
        <h1 className="text-xl font-bold text-brand">{t('scanTitle', lang)}</h1>
        <ScanClient lang={lang} />
      </main>
    </div>
  )
}
