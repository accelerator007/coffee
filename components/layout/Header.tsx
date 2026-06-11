'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lang, t } from '@/lib/i18n'

interface HeaderProps {
  userName?: string
  lang: Lang
  onLangToggle?: () => void
}

export default function Header({ userName, lang, onLangToggle }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-brand text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">☕</span>
        <span className="font-bold text-lg">Coffee</span>
      </div>

      <div className="flex items-center gap-3">
        {onLangToggle && (
          <button
            onClick={onLangToggle}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        )}
        {userName && (
          <span className="text-sm opacity-90 hidden sm:block">{userName}</span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors min-h-8"
        >
          {t('logout', lang)}
        </button>
      </div>
    </header>
  )
}
