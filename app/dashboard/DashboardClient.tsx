'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lang } from '@/lib/i18n'
import Header from '@/components/layout/Header'

export default function DashboardClient({
  userName,
  lang: initialLang,
}: {
  userName?: string
  lang: Lang
}) {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>(initialLang)

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`
    document.documentElement.lang = next
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    router.refresh()
  }

  return <Header userName={userName} lang={lang} onLangToggle={toggleLang} />
}
