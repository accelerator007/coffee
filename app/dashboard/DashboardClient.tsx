'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`
    router.refresh()
  }

  return <Header userName={userName} lang={lang} onLangToggle={toggleLang} />
}
