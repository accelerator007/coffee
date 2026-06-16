'use client'

import { useState } from 'react'
import { Coffee } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import PhoneLoginForm from '@/components/auth/PhoneLoginForm'
import StaffLoginForm from '@/components/auth/StaffLoginForm'

type Tab = 'customer' | 'staff'

export default function LoginClient() {
  const [tab, setTab] = useState<Tab>('customer')
  const [lang, setLang] = useState<Lang>('ar')

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #f3e9da 0%, #faf4ec 55%, #fdfaf5 100%)' }}
    >
      <div className="w-full max-w-sm animate-fade-up">
        {/* Lang toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="text-sm text-text-muted hover:text-brand transition-colors px-4 py-1.5 rounded-full border border-border bg-surface/60 backdrop-blur"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Hero splash */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-brand-gradient shadow-[0_8px_32px_rgba(111,78,55,0.30)] mb-5 text-background">
            <Coffee size={56} strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="text-4xl font-black text-brand tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            {lang === 'ar' ? 'قهوتي' : 'Coffee Shop'}
          </h1>
          <p className="text-text-muted text-sm mt-2 leading-relaxed tracking-wide">
            {lang === 'ar' ? 'اشتراكات القهوة اليومية' : 'Daily Coffee Subscriptions'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl border border-border shadow-[0_8px_32px_rgba(111,78,55,0.12)] p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6">
            {(['customer', 'staff'] as Tab[]).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`
                  flex-1 py-2 px-3 rounded-full text-sm font-semibold transition-all
                  ${tab === tabKey
                    ? 'bg-surface text-brand shadow-sm'
                    : 'text-text-muted hover:text-foreground'
                  }
                `}
              >
                {t(tabKey, lang)}
              </button>
            ))}
          </div>

          {tab === 'customer'
            ? <PhoneLoginForm lang={lang} />
            : <StaffLoginForm lang={lang} />
          }
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6 opacity-60">
          {lang === 'ar' ? 'كل كوب يستحق' : 'Every cup matters'}
        </p>
      </div>
    </div>
  )
}
