'use client'

import { useState } from 'react'
import { Lang } from '@/lib/i18n'
import { addSubscription } from './actions'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type Customer = { id: string; full_name: string; phone: string }
type Package = { id: string; name: string; duration_days: number; daily_allowance: number; price: number }

interface Props {
  lang: Lang
  customers: Customer[]
  packages: Package[]
}

export default function AddSubscriptionClient({ lang, customers, packages }: Props) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })

  const [customerId, setCustomerId] = useState('')
  const [packageId, setPackageId] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedPkg = packages.find(p => p.id === packageId)

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!customerId || !packageId) {
      setError(lang === 'ar' ? 'يرجى اختيار العميل والباقة' : 'Please select customer and package')
      return
    }
    setLoading(true)
    const result = await addSubscription(customerId, packageId, startDate)
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setSuccess(lang === 'ar' ? '✅ تم إضافة الاشتراك بنجاح' : '✅ Subscription added successfully')
      setCustomerId('')
      setPackageId('')
      setStartDate(today)
    }
    setLoading(false)
  }

  const selectClass = `w-full min-h-11 px-4 rounded-xl border border-border bg-surface text-foreground
    focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors`

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Customer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{lang === 'ar' ? 'العميل' : 'Customer'}</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={selectClass}>
            <option value="">{lang === 'ar' ? '— اختر عميلاً —' : '— Select customer —'}</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Package */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{lang === 'ar' ? 'الباقة' : 'Package'}</label>
          <select value={packageId} onChange={e => setPackageId(e.target.value)} className={selectClass}>
            <option value="">{lang === 'ar' ? '— اختر باقة —' : '— Select package —'}</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.duration_days} {lang === 'ar' ? 'يوم' : 'days'} / {p.daily_allowance} {lang === 'ar' ? 'كوب/يوم' : 'cups/day'} — {p.price} OMR
              </option>
            ))}
          </select>
        </div>

        {/* Package preview */}
        {selectedPkg && (
          <div className="bg-muted rounded-xl p-3 text-sm flex gap-4">
            <span>📅 {selectedPkg.duration_days} {lang === 'ar' ? 'يوم' : 'days'}</span>
            <span>☕ {selectedPkg.daily_allowance} {lang === 'ar' ? 'كوب/يوم' : 'cups/day'}</span>
            <span>💰 {selectedPkg.price} OMR</span>
          </div>
        )}

        {/* Start date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={selectClass}
            dir="ltr"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">{success}</p>}

        <Button onClick={handleSubmit} loading={loading} className="w-full">
          {lang === 'ar' ? 'إضافة الاشتراك' : 'Add Subscription'}
        </Button>
      </div>
    </Card>
  )
}
