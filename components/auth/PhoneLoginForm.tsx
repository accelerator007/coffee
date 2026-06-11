'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lang, t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PhoneLoginForm({ lang }: { lang: Lang }) {
  const router = useRouter()
  const supabase = createClient()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    setLoading(true)
    const fullPhone = phone.startsWith('+') ? phone : `+968${phone.replace(/^0/, '')}`
    // Supabase stores phone-based users with email = phone@phone.local
    const { error } = await supabase.auth.signInWithPassword({
      email: `${fullPhone}@phone.local`,
      password,
    })
    if (error) {
      setError(lang === 'ar' ? 'رقم الهاتف أو كلمة المرور غير صحيحة' : 'Incorrect phone or password')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-end">
        <span className="min-h-11 flex items-center px-3 bg-muted border border-border rounded-xl text-text-muted text-sm font-mono" dir="ltr">
          +968
        </span>
        <Input
          label={t('phone', lang)}
          type="tel"
          inputMode="numeric"
          placeholder="9XXXXXXX"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          ltr
        />
      </div>
      <Input
        label={t('password', lang)}
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        error={error}
        ltr
      />
      <Button onClick={handleLogin} loading={loading} className="w-full">
        {t('signIn', lang)}
      </Button>
    </div>
  )
}
