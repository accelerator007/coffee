export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Lang } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import PackagesClient from './PackagesClient'
import { listPackages } from './actions'

export default async function PackagesPage() {
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

  const packages = await listPackages()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={profile?.full_name} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
            ← {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </Link>
          <h1 className="text-xl font-bold text-brand">
            {lang === 'ar' ? 'الباقات' : 'Packages'}
          </h1>
        </div>
        <PackagesClient lang={lang} packages={packages} />
      </main>
    </div>
  )
}
