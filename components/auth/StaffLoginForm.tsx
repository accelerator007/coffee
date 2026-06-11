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

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@internal.local`,
      password,
    })
    if (error) {
      setError(lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password')
    } else {
      router.push('/scan')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('username', lang)}
        type="text"
        placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
        value={username}
        onChange={e => setUsername(e.target.value)}
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
