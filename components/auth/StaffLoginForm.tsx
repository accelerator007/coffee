'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lang, t } from '@/lib/i18n'
import { legacyStaffAuthEmail, staffAuthEmail } from '@/lib/phone'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function StaffLoginForm({ lang }: { lang: Lang }) {
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    // Created on submit, not on render, so the login page can prerender
    // statically without Supabase env vars at build time.
    const supabase = createClient()
    setError('')
    setLoading(true)

    // Support both real email and username (appends @internal.local)
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const email = normalizedIdentifier.includes('@')
      ? normalizedIdentifier
      : staffAuthEmail(normalizedIdentifier)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const legacyEmail = normalizedIdentifier.includes('@')
        ? normalizedIdentifier
        : legacyStaffAuthEmail(normalizedIdentifier)
      const { error: legacyError } = await supabase.auth.signInWithPassword({ email: legacyEmail, password })

      if (legacyError) {
        setError(lang === 'ar' ? 'البريد/اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials')
        setLoading(false)
        return
      }
    } else {
      // Signed in with the primary Auth-valid internal email.
    }

    // Let the server route admin and employee accounts from their trusted role.
    router.replace('/')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={lang === 'ar' ? 'البريد الإلكتروني أو اسم المستخدم' : 'Email or Username'}
        type="text"
        placeholder={lang === 'ar' ? 'أدخل البريد أو اسم المستخدم' : 'Enter email or username'}
        value={identifier}
        onChange={e => setIdentifier(e.target.value)}
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
        {t('signIn', lang)}
      </Button>
    </div>
  )
}
