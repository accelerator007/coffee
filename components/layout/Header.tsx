'use client'

import { useRouter } from 'next/navigation'
import { Globe, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Lang } from '@/lib/i18n'
import Logo from '@/components/ui/Logo'

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

  const iconBtn =
    'inline-flex items-center gap-1.5 border border-border bg-surface text-foreground rounded-full px-3 py-1.5 text-xs font-bold hover:bg-muted transition-colors min-h-9'

  return (
    <header className="glass border-b border-border px-4 sm:px-5 flex items-center gap-2.5 sticky top-0 z-10 min-h-[60px]">
      <Logo variant="mono" size={34} bordered wordmark />

      <div className="ms-auto flex items-center gap-2">
        {userName && (
          <span className="text-sm text-text-muted hidden sm:block max-w-[10rem] truncate">{userName}</span>
        )}
        {onLangToggle && (
          <button onClick={onLangToggle} className={iconBtn} title="Language" aria-label="Toggle language">
            <Globe size={17} strokeWidth={1.75} aria-hidden />
            <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
        )}
        <button onClick={handleLogout} className={iconBtn} title="Sign out" aria-label="Sign out">
          <LogOut size={17} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </header>
  )
}
