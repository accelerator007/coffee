'use client'

import { useEffect, useState } from 'react'
import { Lang, t, brand } from '@/lib/i18n'
import Logo from '@/components/ui/Logo'
import Card from '@/components/ui/Card'
import SegmentedTabs from '@/components/ui/SegmentedTabs'
import PhoneLoginForm from '@/components/auth/PhoneLoginForm'
import StaffLoginForm from '@/components/auth/StaffLoginForm'

type Tab = 'customer' | 'staff'

export default function LoginClient() {
  const [tab, setTab] = useState<Tab>('customer')
  const [lang, setLang] = useState<Lang>('ar')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  function toggleLang() {
    setLang(current => {
      const next: Lang = current === 'ar' ? 'en' : 'ar'
      document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`
      document.documentElement.lang = next
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
      return next
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center px-[22px] py-10"
      style={{ background: 'var(--wash-login)' }}
    >
      <div className="w-full max-w-sm mx-auto animate-fade-up">
        {/* Lang toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLang}
            className="text-xs font-bold text-text-muted hover:text-foreground transition-colors px-4 py-1.5 rounded-full border border-border bg-surface/70 backdrop-blur"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Hero logo */}
        <div className="text-center mb-7">
          <Logo
            variant="circle"
            size={140}
            className="drop-shadow-[0_10px_40px_rgba(17,17,17,0.10)]"
          />
        </div>

        {/* Card */}
        <Card variant="warm" className="flex flex-col gap-5 p-6">
          <SegmentedTabs
            block
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            tabs={[
              { value: 'customer', label: lang === 'ar' ? 'عميل' : 'Customer' },
              { value: 'staff', label: lang === 'ar' ? 'موظف' : 'Staff' },
            ]}
          />

          {tab === 'customer' ? <PhoneLoginForm lang={lang} /> : <StaffLoginForm lang={lang} />}

          <p className="text-[13px] text-text-muted text-center m-0">
            {lang === 'ar' ? brand.beansAr : t('beansBy', lang)}
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          {lang === 'ar' ? `${brand.nameAr} · ${brand.shortLocationAr}` : `${brand.name} · ${brand.shortLocation}`}
        </p>
      </div>
    </div>
  )
}
