'use client'

import { useState } from 'react'
import { Lang } from '@/lib/i18n'
import Header from '@/components/layout/Header'

export default function DashboardClient({
  userName,
  lang: initialLang,
}: {
  userName?: string
  lang: Lang
}) {
  const [lang, setLang] = useState<Lang>(initialLang)

  function toggleLang() {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    document.cookie = `lang=${next};path=/;max-age=31536000`
  }

  return <Header userName={userName} lang={lang} onLangToggle={toggleLang} />
}
