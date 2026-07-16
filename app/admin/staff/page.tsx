export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Lang } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import StaffClient from '@/components/admin/StaffClient'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  const fullName = user.user_metadata?.full_name as string | undefined

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={fullName} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <StaffClient lang={lang} />
      </main>
    </div>
  )
}
