export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCurrentUserContext } from '@/lib/auth/roles'
import { Lang } from '@/lib/i18n'
import AdminPageClient from '../AdminPageClient'
import StaffClient from '@/components/admin/StaffClient'

export default async function StaffPage() {
  const currentUser = await getCurrentUserContext()
  if (!currentUser) redirect('/login')

  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) ?? 'ar'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminPageClient userName={currentUser.fullName} lang={lang} />
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <StaffClient lang={lang} />
      </main>
    </div>
  )
}
