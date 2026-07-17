'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Lang, t, TranslationKey } from '@/lib/i18n'
import { normalizeOmanPhone, phoneAuthEmail } from '@/lib/phone'
import { registerCustomer } from '@/app/login/actions'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/** Map a server-action error token to a localized message (falls back to raw). */
function resolveError(token: string, lang: Lang): string {
  const knownKeys: TranslationKey[] = ['phoneAlreadyRegistered', 'passwordTooShort', 'referralNotFound']
  if ((knownKeys as string[]).includes(token)) return t(token as TranslationKey, lang)
  return token
}

export default function CustomerRegisterForm({ lang }: { lang: Lang }) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [referral, setReferral] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ar = lang === 'ar'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    if (!fullName.trim()) {
      setError(ar ? 'أدخل اسمك' : 'Enter your name')
      return
    }
    const normalized = normalizeOmanPhone(phone)
    if (!normalized.ok) {
      setError(ar ? 'أدخل رقم هاتف عماني صحيح من 8 أرقام' : 'Enter a valid 8-digit Oman mobile number')
      return
    }
    if (password.length < 6) {
      setError(t('passwordTooShort', lang))
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await registerCustomer({
        full_name: fullName,
        phone,
        password,
        birth_date: birthDate || undefined,
        referral_code: referral || undefined,
      })

      if ('error' in result && result.error) {
        setError(resolveError(result.error, lang))
        return
      }

      // Sign the new customer in with the same internal email login uses.
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: phoneAuthEmail(normalized.local),
        password,
      })
      if (authError) {
        setError(ar ? 'تم إنشاء الحساب، سجّل الدخول الآن' : 'Account created, please sign in')
        return
      }

      // The server validates the role and selects the only allowed destination.
      router.replace('/')
      router.refresh()
    } catch {
      setError(ar ? 'تعذر الاتصال. تحقق من الإنترنت وحاول مجدداً' : 'Could not connect. Check your internet and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Input
        label={t('fullName', lang)}
        type="text"
        autoComplete="name"
        placeholder={ar ? 'اسمك الكامل' : 'Your full name'}
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        disabled={loading}
      />
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
        autoComplete="new-password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={loading}
        ltr
      />
      <Input
        label={t('birthDate', lang)}
        type="date"
        value={birthDate}
        onChange={e => setBirthDate(e.target.value)}
        disabled={loading}
        ltr
      />
      <Input
        label={t('referralCodeOptional', lang)}
        type="text"
        autoComplete="off"
        placeholder="D7XXXXXX"
        value={referral}
        onChange={e => setReferral(e.target.value.toUpperCase())}
        error={error}
        disabled={loading}
        ltr
      />
      <Button type="submit" loading={loading} disabled={loading} size="lg" block>
        <UserPlus size={18} aria-hidden />
        {t('createAccount', lang)}
      </Button>
    </form>
  )
}
