'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lang, t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function StaffLoginForm({ lang }: { lang: Lang }) {
  const router = useRouter()
  const supabase = createClient()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    setLoading(true)

    // Support both real email and username (appends @internal.local)
    const email = identifier.includes('@') ? identifier : `${identifier}@internal.local`

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(lang === 'ar' ? 'البريد/اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials')
    } else {
      router.push('/admin')
      router.refresh()
    }
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
      <Button onClick={handleLogin} loading={loading} className="w-full">
        {t('signIn', lang)}
      </Button>
    </div>
  )
}
