'use client'

import { useState } from 'react'
import { Lang, t } from '@/lib/i18n'
import PhoneLoginForm from '@/components/auth/PhoneLoginForm'
import StaffLoginForm from '@/components/auth/StaffLoginForm'

type Tab = 'customer' | 'staff'

export default function LoginClient() {
  const [tab, setTab] = useState<Tab>('customer')
  const [lang, setLang] = useState<Lang>('ar')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Lang toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="text-sm text-text-muted hover:text-brand transition-colors px-4 py-1.5 rounded-full border border-border"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted shadow-[0_4px_24px_rgba(111,78,55,0.15)] mb-4 text-5xl">
            ☕
          </div>
          <h1 className="text-4xl font-black text-brand tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Coffee
          </h1>
          <p className="text-text-muted text-sm mt-2 leading-relaxed">
            {lang === 'ar' ? 'اشتراكات القهوة اليومية' : 'Daily Coffee Subscriptions'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl border border-border shadow-[0_4px_24px_rgba(111,78,55,0.10)] p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6">
            {(['customer', 'staff'] as Tab[]).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`
                  flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all
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
