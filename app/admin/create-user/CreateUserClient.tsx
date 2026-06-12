'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lang, t } from '@/lib/i18n'
import { createCustomer, createEmployee } from './actions'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

type Tab = 'customer' | 'employee'

export default function CreateUserClient({ lang }: { lang: Lang }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('customer')

  // Customer fields
  const [cName, setCName] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cPass, setCPass] = useState('')

  // Employee fields
  const [eName, setEName] = useState('')
  const [eUsername, setEUsername] = useState('')
  const [ePass, setEPass] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate() {
    setError('')
    setSuccess('')
    setLoading(true)

    let result
    if (tab === 'customer') {
      if (!cName || !cPhone || !cPass) {
        setError(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields')
        setLoading(false)
        return
      }
      result = await createCustomer({ full_name: cName, phone: cPhone, password: cPass })
    } else {
      if (!eName || !eUsername || !ePass) {
        setError(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields')
        setLoading(false)
        return
      }
      result = await createEmployee({ full_name: eName, username: eUsername, password: ePass })
    }

    if ('error' in result && result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // After creating a customer, go straight to assigning a subscription + NFC card.
    if (tab === 'customer' && 'userId' in result && result.userId) {
      router.push(`/admin/add-subscription?customer=${result.userId}`)
      return
    }

    setSuccess(lang === 'ar' ? '✅ تم إنشاء الحساب بنجاح' : '✅ Account created successfully')
    setEName(''); setEUsername(''); setEPass('')
    setLoading(false)
  }

  return (
    <Card>
      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
        {(['customer', 'employee'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => { setTab(tabKey); setError(''); setSuccess('') }}
            className={`
              flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
              ${tab === tabKey ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-foreground'}
            `}
          >
            {tabKey === 'customer' ? t('customer', lang) : t('staff', lang)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {tab === 'customer' ? (
          <>
            <Input
              label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              placeholder={lang === 'ar' ? 'أدخل الاسم' : 'Enter name'}
              value={cName}
              onChange={e => setCName(e.target.value)}
            />
            <div className="flex gap-2 items-end">
              <span className="min-h-11 flex items-center px-3 bg-muted border border-border rounded-xl text-text-muted text-sm font-mono" dir="ltr">
                +968
              </span>
              <Input
                label={t('phone', lang)}
                type="tel"
                inputMode="numeric"
                placeholder="9XXXXXXX"
                value={cPhone}
                onChange={e => setCPhone(e.target.value)}
                ltr
              />
            </div>
            <Input
              label={t('password', lang)}
              type="password"
              placeholder="••••••••"
              value={cPass}
              onChange={e => setCPass(e.target.value)}
              ltr
            />
          </>
        ) : (
          <>
            <Input
              label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              placeholder={lang === 'ar' ? 'أدخل الاسم' : 'Enter name'}
              value={eName}
              onChange={e => setEName(e.target.value)}
            />
            <Input
              label={t('username', lang)}
              placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
              value={eUsername}
              onChange={e => setEUsername(e.target.value)}
              ltr
            />
            <Input
              label={t('password', lang)}
              type="password"
              placeholder="••••••••"
              value={ePass}
              onChange={e => setEPass(e.target.value)}
              ltr
            />
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">{success}</p>}

        <Button onClick={handleCreate} loading={loading} className="w-full">
          {lang === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
        </Button>
      </div>
    </Card>
  )
}
