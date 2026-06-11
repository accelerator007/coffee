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
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp() {
    setError('')
    setLoading(true)
    const fullPhone = phone.startsWith('+') ? phone : `+968${phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  async function verifyOtp() {
    setError('')
    setLoading(true)
    const fullPhone = phone.startsWith('+') ? phone : `+968${phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: 'sms' })
    if (error) setError(error.message)
    else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {step === 'phone' ? (
        <>
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
              error={error}
            />
          </div>
          <Button onClick={sendOtp} loading={loading} className="w-full">
            {t('sendOtp', lang)}
          </Button>
        </>
      ) : (
        <>
          <Input
            label={t('enterOtp', lang)}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="------"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            ltr
            error={error}
          />
          <Button onClick={verifyOtp} loading={loading} className="w-full">
            {t('verify', lang)}
          </Button>
          <button
            onClick={() => { setStep('phone'); setError('') }}
            className="text-sm text-text-muted underline text-center"
          >
            {lang === 'ar' ? 'تغيير رقم الهاتف' : 'Change phone number'}
          </button>
        </>
      )}
    </div>
  )
}
