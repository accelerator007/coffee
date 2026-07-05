'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Phone } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PhoneLoginForm({ lang }: { lang: Lang }) {
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    // Created on submit, not on render, so the login page can prerender
    // statically without Supabase env vars at build time.
    const supabase = createClient()
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
      <Input
        label={t('phone', lang)}
        type="tel"
        inputMode="numeric"
        prefix="+968"
        placeholder="9XXX XXXX"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        ltr
      />
      <Input
        label={t('password', lang)}
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        error={error}
        ltr
      />
      <Button onClick={handleLogin} loading={loading} size="lg" block>
        <Phone size={18} aria-hidden />
        {t('signIn', lang)}
      </Button>
    </div>
  )
}
