'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee } from 'lucide-react'
import { Lang } from '@/lib/i18n'
import { createPackage, updatePackage, type Tier } from './actions'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import TierBadge from '@/components/ui/TierBadge'

type Package = {
  id: string
  name: string
  duration_days: number
  daily_allowance: number
  price: number
  tier: string | null
}

const empty = { name: '', duration_days: '', daily_allowance: '', price: '', tier: '' }
const TIERS: Tier[] = ['gold', 'silver', 'bronze']

export default function PackagesClient({ lang, packages }: { lang: Lang; packages: Package[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ar = lang === 'ar'
  const inputClass = `w-full min-h-11 px-4 rounded-2xl border border-border bg-surface text-foreground
    focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand`

  function startEdit(p: Package) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      duration_days: String(p.duration_days),
      daily_allowance: String(p.daily_allowance),
      price: String(p.price),
      tier: p.tier ?? '',
    })
    setError('')
  }

  function startNew() {
    setEditingId('new')
    setForm(empty)
    setError('')
  }

  function cancel() {
    setEditingId(null)
    setForm(empty)
    setError('')
  }

  async function save() {
    setError('')
    const name = form.name.trim()
    const duration_days = parseInt(form.duration_days, 10)
    const daily_allowance = parseInt(form.daily_allowance, 10)
    const price = parseFloat(form.price)

    if (!name || !duration_days || !daily_allowance || isNaN(price)) {
      setError(ar ? 'يرجى ملء جميع الحقول بقيم صحيحة' : 'Please fill all fields with valid values')
      return
    }

    setLoading(true)
    const tier = (form.tier || null) as Tier | null
    const payload = { name, duration_days, daily_allowance, price, tier }
    const result = editingId === 'new'
      ? await createPackage(payload)
      : await updatePackage(editingId!, payload)
    setLoading(false)

    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    cancel()
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {editingId === null && (
        <Button onClick={startNew} className="self-start">
          {ar ? '+ باقة جديدة' : '+ New Package'}
        </Button>
      )}

      {/* Add / Edit form */}
      {editingId !== null && (
        <Card>
          <h3 className="font-semibold mb-4">
            {editingId === 'new' ? (ar ? 'باقة جديدة' : 'New Package') : (ar ? 'تعديل الباقة' : 'Edit Package')}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{ar ? 'اسم الباقة' : 'Package Name'}</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={ar ? 'مثال: باقة شهرية' : 'e.g. Monthly'}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{ar ? 'المدة (أيام)' : 'Duration (days)'}</label>
              <input
                type="number" inputMode="numeric" min="1"
                value={form.duration_days}
                onChange={e => setForm({ ...form, duration_days: e.target.value })}
                placeholder="30"
                className={inputClass} dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{ar ? 'الحصة اليومية (كوب/يوم)' : 'Daily Allowance (cups/day)'}</label>
              <input
                type="number" inputMode="numeric" min="1"
                value={form.daily_allowance}
                onChange={e => setForm({ ...form, daily_allowance: e.target.value })}
                placeholder="2"
                className={inputClass} dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{ar ? 'السعر (ر.ع)' : 'Price (OMR)'}</label>
              <input
                type="number" inputMode="decimal" min="0" step="0.001"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="15.000"
                className={inputClass} dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{ar ? 'الفئة' : 'Tier'}</label>
              <select
                value={form.tier}
                onChange={e => setForm({ ...form, tier: e.target.value })}
                className={inputClass}
              >
                <option value="">{ar ? 'بدون فئة' : 'No tier'}</option>
                {TIERS.map(tr => (
                  <option key={tr} value={tr}>
                    {tr === 'gold' ? (ar ? 'ذهبية' : 'Gold') : tr === 'silver' ? (ar ? 'فضية' : 'Silver') : (ar ? 'برونزية' : 'Bronze')}
                  </option>
                ))}
              </select>
            </div>

            {error && <p role="alert" className="text-sm text-danger">{error}</p>}

            <div className="flex gap-3">
              <Button onClick={save} loading={loading} className="flex-1">
                {ar ? 'حفظ' : 'Save'}
              </Button>
              <Button onClick={cancel} variant="secondary">
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      {packages.length === 0 && editingId === null ? (
        <Card className="text-center py-8 text-text-muted">
          {ar ? 'لا توجد باقات بعد' : 'No packages yet'}
        </Card>
      ) : (
        <Card className="py-1">
          <div className="divide-y divide-border/60">
            {packages.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand-gradient text-background flex items-center justify-center shadow-sm">
                  <Coffee size={22} strokeWidth={1.75} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-2">
                    <h4 className="font-bold text-foreground truncate">{p.name}</h4>
                    <TierBadge tier={p.tier} lang={lang} />
                  </span>
                  <p className="text-sm text-text-muted">
                    {p.duration_days} {ar ? 'يوم' : 'd'} · {p.daily_allowance} {ar ? 'كوب/يوم' : 'cups'} · {p.price} {ar ? 'ر.ع' : 'OMR'}
                  </p>
                </div>
                <Button variant="soft" onClick={() => startEdit(p)} className="min-h-9 px-4 text-sm">
                  {ar ? 'تعديل' : 'Edit'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
