'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Phone } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import { legacyPhoneAuthEmail, legacySafePhoneAuthEmail, normalizeOmanPhone, phoneAuthEmail } from '@/lib/phone'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PhoneLoginForm({ lang }: { lang: Lang }) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    const normalized = normalizeOmanPhone(phone)
    if (!normalized.ok) {
      setError(lang === 'ar' ? 'أدخل رقم هاتف عماني صحيح من 8 أرقام' : 'Enter a valid 8-digit Oman mobile number')
      return
    }

    if (!password) {
      setError(lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password')
      return
    }

    const supabase = createClient()
    setError('')
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: phoneAuthEmail(normalized.local),
        password,
      })

      if (authError) {
        const legacyAttempts = [
          legacySafePhoneAuthEmail(normalized.local),
          legacyPhoneAuthEmail(normalized.international),
        ]

        let signedIn = false
        for (const email of legacyAttempts) {
          const { error: legacyAuthError } = await supabase.auth.signInWithPassword({ email, password })
          if (!legacyAuthError) {
            signedIn = true
            break
          }
        }

        if (!signedIn) {
          setError(lang === 'ar' ? 'رقم الهاتف أو كلمة المرور غير صحيحة' : 'Incorrect phone or password')
          return
        }
      }

      // The server validates the role and selects the only allowed destination.
      router.replace('/')
      router.refresh()
    } catch {
      setError(lang === 'ar' ? 'تعذر الاتصال. تحقق من الإنترنت وحاول مجدداً' : 'Could not connect. Check your internet and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleLogin} noValidate>
      <Input
        label={t('phone', lang)}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        prefix="+968"
        placeholder="9XXX XXXX"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        disabled={loading}
        ltr
      />
      <Input
        label={t('password', lang)}
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        error={error}
        disabled={loading}
        ltr
      />
      <Button type="submit" loading={loading} disabled={loading} size="lg" block>
        <Phone size={18} aria-hidden />
        {t('signIn', lang)}
      </Button>
    </form>
  )
}
