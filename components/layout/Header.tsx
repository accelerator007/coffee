'use client'

import { useRouter } from 'next/navigation'
import { Coffee } from 'lucide-react'
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
    <header className="bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_8px_rgba(111,78,55,0.07)]">
      <div className="flex items-center gap-2">
        <Coffee size={24} strokeWidth={1.75} className="text-brand" aria-hidden />
        <span className="font-black text-lg text-brand" style={{ fontFamily: 'var(--font-heading)' }}>Coffee</span>
      </div>

      <div className="flex items-center gap-2">
        {onLangToggle && (
          <button
            onClick={onLangToggle}
            className="text-sm text-latte border border-border hover:bg-muted px-3 py-1 rounded-full transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        )}
        {userName && (
          <span className="text-sm text-text-muted hidden sm:block">{userName}</span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-brand border border-border hover:bg-muted px-3 py-1.5 rounded-full transition-colors min-h-8"
        >
          {t('logout', lang)}
        </button>
      </div>
    </header>
  )
}
