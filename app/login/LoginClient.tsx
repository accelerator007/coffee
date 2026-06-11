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
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="text-sm text-text-muted hover:text-brand transition-colors px-3 py-1 rounded-lg border border-border"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-3">☕</div>
          <h1 className="text-2xl font-bold text-brand">Coffee</h1>
          <p className="text-text-muted text-sm mt-1">
            {lang === 'ar' ? 'إدارة اشتراكات القهوة' : 'Coffee Subscription Management'}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
            {(['customer', 'staff'] as Tab[]).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
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
      </div>
    </div>
  )
}
