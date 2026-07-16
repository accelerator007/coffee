'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Gift, Megaphone, Sparkles, Star, WalletCards } from 'lucide-react'
import { Lang } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import TierBadge from '@/components/ui/TierBadge'
import {
  adjustCustomerPoints,
  createDoublePointDay,
  createOffer,
  deleteDoublePointDay,
  deleteOffer,
  updateLoyaltySettings,
  updateLoyaltyTier,
  updateOffer,
  type DoublePointDayInput,
  type LoyaltyTier,
  type LoyaltyTierInput,
  type OfferInput,
} from './actions'

type Settings = {
  points_per_redemption: number
  referred_customer_points: number
}

type TierRow = {
  slug: LoyaltyTier
  name_ar: string
  name_en: string
  min_points: number
  points_multiplier: number
  birthday_points: number
  referral_points: number
  is_active: boolean
}

type OfferRow = OfferInput & {
  id: string
  created_at: string
}

type DoubleDayRow = DoublePointDayInput & {
  id: string
}

type CustomerRow = {
  id: string
  full_name: string
  phone: string | null
  loyalty_accounts?: {
    points_balance: number
    lifetime_points: number
    referral_code: string
  } | null
}

type TransactionRow = {
  id: string
  points: number
  type: string
  description: string
  created_at: string
  profiles?: { full_name: string | null } | null
}

type Kpis = {
  points_issued: number
  points_spent: number
  active_offers: number
  claims_count: number
  upcoming_double_days: number
}

const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold']

const emptyOffer = (): OfferInput => ({
  title_ar: '',
  title_en: '',
  body_ar: '',
  body_en: '',
  badge_ar: '',
  badge_en: '',
  starts_at: toDateTimeInput(new Date().toISOString()),
  ends_at: '',
  is_active: true,
  target_tier: null,
  points_cost: 0,
  reward_points: 0,
  sort_order: 0,
})

function toDateTimeInput(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function fromDateTimeInput(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function tierName(slug: string | null, lang: Lang) {
  if (!slug) return lang === 'ar' ? 'كل المستويات' : 'All tiers'
  if (slug === 'gold') return lang === 'ar' ? 'ذهبي' : 'Gold'
  if (slug === 'silver') return lang === 'ar' ? 'فضي' : 'Silver'
  return lang === 'ar' ? 'برونزي' : 'Bronze'
}

export default function LoyaltyClient({
  lang,
  settings,
  tiers,
  offers,
  doubleDays,
  customers,
  transactions,
  kpis,
}: {
  lang: Lang
  settings: Settings
  tiers: TierRow[]
  offers: OfferRow[]
  doubleDays: DoubleDayRow[]
  customers: CustomerRow[]
  transactions: TransactionRow[]
  kpis?: Kpis
}) {
  const router = useRouter()
  const ar = lang === 'ar'
  const [settingsForm, setSettingsForm] = useState(settings)
  const [tierForms, setTierForms] = useState<Record<string, LoyaltyTierInput>>(() => {
    const forms: Record<string, LoyaltyTierInput> = {}
    for (const tier of tiers) {
      forms[tier.slug] = {
        min_points: tier.min_points,
        points_multiplier: tier.points_multiplier,
        birthday_points: tier.birthday_points,
        referral_points: tier.referral_points,
        is_active: tier.is_active,
      }
    }
    return forms
  })
  const [offerId, setOfferId] = useState<string | null>(null)
  const [offerForm, setOfferForm] = useState<OfferInput>(emptyOffer)
  const [doubleForm, setDoubleForm] = useState<DoublePointDayInput>({
    title_ar: '',
    title_en: '',
    day: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' }),
    multiplier: 2,
    is_active: true,
  })
  const [adjustForm, setAdjustForm] = useState({ customerId: '', points: '', description: '' })
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => tierOrder.indexOf(a.slug) - tierOrder.indexOf(b.slug)),
    [tiers]
  )

  const inputClass = `w-full min-h-11 px-4 rounded-2xl border border-border bg-surface text-foreground
    focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand`

  async function run(key: string, action: () => Promise<{ error?: string; success?: boolean }>) {
    setBusy(key)
    setMessage('')
    const result = await action()
    setBusy('')
    if (result.error) {
      setMessage(result.error)
      return
    }
    setMessage(ar ? 'تم الحفظ' : 'Saved')
    router.refresh()
  }

  function startOffer(row?: OfferRow) {
    setMessage('')
    if (!row) {
      setOfferId('new')
      setOfferForm(emptyOffer())
      return
    }
    setOfferId(row.id)
    setOfferForm({
      title_ar: row.title_ar,
      title_en: row.title_en,
      body_ar: row.body_ar,
      body_en: row.body_en,
      badge_ar: row.badge_ar,
      badge_en: row.badge_en,
      starts_at: toDateTimeInput(row.starts_at),
      ends_at: toDateTimeInput(row.ends_at),
      is_active: row.is_active,
      target_tier: row.target_tier,
      points_cost: row.points_cost,
      reward_points: row.reward_points,
      sort_order: row.sort_order,
    })
  }

  function normalizedOffer() {
    return {
      ...offerForm,
      starts_at: fromDateTimeInput(offerForm.starts_at) ?? new Date().toISOString(),
      ends_at: fromDateTimeInput(offerForm.ends_at),
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
          ← {ar ? 'لوحة التحكم' : 'Dashboard'}
        </Link>
        <h1 className="text-xl font-bold text-brand">{ar ? 'الولاء والمكافآت' : 'Loyalty & Rewards'}</h1>
      </div>

      {message && (
        <p role="status" className={`text-sm font-medium ${message === 'تم الحفظ' || message === 'Saved' ? 'text-success' : 'text-danger'}`}>
          {message}
        </p>
      )}

      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric icon={<Sparkles size={18} />} label={ar ? 'نقاط مُضافة' : 'Issued'} value={kpis.points_issued} />
          <Metric icon={<WalletCards size={18} />} label={ar ? 'نقاط مصروفة' : 'Spent'} value={kpis.points_spent} />
          <Metric icon={<Megaphone size={18} />} label={ar ? 'عروض فعالة' : 'Active offers'} value={kpis.active_offers} />
          <Metric icon={<Gift size={18} />} label={ar ? 'مطالبات' : 'Claims'} value={kpis.claims_count} />
          <Metric icon={<CalendarDays size={18} />} label={ar ? 'أيام مضاعفة' : 'Double days'} value={kpis.upcoming_double_days} />
        </div>
      )}

      <Card>
        <SectionHeading
          icon={<Star size={18} />}
          title={ar ? 'قواعد النقاط' : 'Points rules'}
          subtitle={ar ? 'هذه القيم تتحكم في كل عملية تسجيل كوب وإحالة.' : 'These values control every cup redemption and referral.'}
        />
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <Field label={ar ? 'نقاط كل كوب' : 'Points per cup'}>
            <input
              type="number"
              min="0"
              value={settingsForm.points_per_redemption}
              onChange={e => setSettingsForm({ ...settingsForm, points_per_redemption: Number(e.target.value) })}
              className={inputClass}
              dir="ltr"
            />
          </Field>
          <Field label={ar ? 'هدية العميل المُحال' : 'Referred customer gift'}>
            <input
              type="number"
              min="0"
              value={settingsForm.referred_customer_points}
              onChange={e => setSettingsForm({ ...settingsForm, referred_customer_points: Number(e.target.value) })}
              className={inputClass}
              dir="ltr"
            />
          </Field>
        </div>
        <Button
          onClick={() => run('settings', () => updateLoyaltySettings(settingsForm))}
          loading={busy === 'settings'}
          className="mt-4"
        >
          {ar ? 'حفظ القواعد' : 'Save rules'}
        </Button>
      </Card>

      <Card>
        <SectionHeading
          icon={<Star size={18} />}
          title={ar ? 'المستويات' : 'Tiers'}
          subtitle={ar ? 'الترقية تعتمد على إجمالي النقاط المكتسبة مدى الحياة.' : 'Tier upgrades are based on lifetime earned points.'}
        />
        <div className="divide-y divide-border/60 mt-2">
          {sortedTiers.map(tier => {
            const form = tierForms[tier.slug]
            return (
              <div key={tier.slug} className="py-4 grid lg:grid-cols-[1fr_5fr_auto] gap-3 items-end">
                <div>
                  <TierBadge tier={tier.slug} lang={lang} />
                  <p className="text-sm text-text-muted mt-2">{tierName(tier.slug, lang)}</p>
                </div>
                <div className="grid sm:grid-cols-5 gap-2">
                  <MiniField label={ar ? 'من نقطة' : 'From'}>
                    <input type="number" min="0" value={form.min_points} onChange={e => setTierForms({ ...tierForms, [tier.slug]: { ...form, min_points: Number(e.target.value) } })} className={inputClass} dir="ltr" />
                  </MiniField>
                  <MiniField label={ar ? 'مضاعف' : 'Multiplier'}>
                    <input type="number" min="1" step="0.05" value={form.points_multiplier} onChange={e => setTierForms({ ...tierForms, [tier.slug]: { ...form, points_multiplier: Number(e.target.value) } })} className={inputClass} dir="ltr" />
                  </MiniField>
                  <MiniField label={ar ? 'عيد الميلاد' : 'Birthday'}>
                    <input type="number" min="0" value={form.birthday_points} onChange={e => setTierForms({ ...tierForms, [tier.slug]: { ...form, birthday_points: Number(e.target.value) } })} className={inputClass} dir="ltr" />
                  </MiniField>
                  <MiniField label={ar ? 'الإحالة' : 'Referral'}>
                    <input type="number" min="0" value={form.referral_points} onChange={e => setTierForms({ ...tierForms, [tier.slug]: { ...form, referral_points: Number(e.target.value) } })} className={inputClass} dir="ltr" />
                  </MiniField>
                  <label className="flex items-center gap-2 min-h-11 px-2">
                    <input type="checkbox" checked={form.is_active} onChange={e => setTierForms({ ...tierForms, [tier.slug]: { ...form, is_active: e.target.checked } })} />
                    <span className="text-sm">{ar ? 'فعال' : 'Active'}</span>
                  </label>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => run(`tier-${tier.slug}`, () => updateLoyaltyTier(tier.slug, form))}
                  loading={busy === `tier-${tier.slug}`}
                >
                  {ar ? 'حفظ' : 'Save'}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <SectionHeading
          icon={<Megaphone size={18} />}
          title={ar ? 'العروض داخل الموقع' : 'In-site offers'}
          subtitle={ar ? 'العرض يظهر في لوحة العميل حسب التاريخ والمستوى والنقاط المطلوبة.' : 'Offers appear in the customer dashboard based on dates, tier, and point cost.'}
        />
        {offerId === null ? (
          <Button onClick={() => startOffer()} className="mt-4">{ar ? '+ عرض جديد' : '+ New offer'}</Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={ar ? 'العنوان عربي' : 'Arabic title'}><input value={offerForm.title_ar} onChange={e => setOfferForm({ ...offerForm, title_ar: e.target.value })} className={inputClass} /></Field>
              <Field label={ar ? 'العنوان إنجليزي' : 'English title'}><input value={offerForm.title_en} onChange={e => setOfferForm({ ...offerForm, title_en: e.target.value })} className={inputClass} /></Field>
              <Field label={ar ? 'الوصف عربي' : 'Arabic body'}><textarea value={offerForm.body_ar} onChange={e => setOfferForm({ ...offerForm, body_ar: e.target.value })} className={`${inputClass} py-3 min-h-24`} /></Field>
              <Field label={ar ? 'الوصف إنجليزي' : 'English body'}><textarea value={offerForm.body_en} onChange={e => setOfferForm({ ...offerForm, body_en: e.target.value })} className={`${inputClass} py-3 min-h-24`} /></Field>
              <Field label={ar ? 'شارة قصيرة عربي' : 'Arabic badge'}><input value={offerForm.badge_ar} onChange={e => setOfferForm({ ...offerForm, badge_ar: e.target.value })} className={inputClass} placeholder={ar ? 'مثال: حصري' : 'e.g. Exclusive'} /></Field>
              <Field label={ar ? 'شارة قصيرة إنجليزي' : 'English badge'}><input value={offerForm.badge_en} onChange={e => setOfferForm({ ...offerForm, badge_en: e.target.value })} className={inputClass} placeholder="Exclusive" /></Field>
              <Field label={ar ? 'يبدأ' : 'Starts'}><input type="datetime-local" value={offerForm.starts_at} onChange={e => setOfferForm({ ...offerForm, starts_at: e.target.value })} className={inputClass} dir="ltr" /></Field>
              <Field label={ar ? 'ينتهي' : 'Ends'}><input type="datetime-local" value={offerForm.ends_at ?? ''} onChange={e => setOfferForm({ ...offerForm, ends_at: e.target.value })} className={inputClass} dir="ltr" /></Field>
              <Field label={ar ? 'المستوى المستهدف' : 'Target tier'}>
                <select value={offerForm.target_tier ?? ''} onChange={e => setOfferForm({ ...offerForm, target_tier: (e.target.value || null) as LoyaltyTier | null })} className={inputClass}>
                  <option value="">{ar ? 'كل المستويات' : 'All tiers'}</option>
                  {tierOrder.map(slug => <option key={slug} value={slug}>{tierName(slug, lang)}</option>)}
                </select>
              </Field>
              <Field label={ar ? 'تكلفة النقاط' : 'Point cost'}><input type="number" min="0" value={offerForm.points_cost} onChange={e => setOfferForm({ ...offerForm, points_cost: Number(e.target.value) })} className={inputClass} dir="ltr" /></Field>
              <Field label={ar ? 'نقاط مكافأة' : 'Reward points'}><input type="number" min="0" value={offerForm.reward_points} onChange={e => setOfferForm({ ...offerForm, reward_points: Number(e.target.value) })} className={inputClass} dir="ltr" /></Field>
              <Field label={ar ? 'الترتيب' : 'Sort'}><input type="number" value={offerForm.sort_order} onChange={e => setOfferForm({ ...offerForm, sort_order: Number(e.target.value) })} className={inputClass} dir="ltr" /></Field>
              <label className="flex items-center gap-2 min-h-11">
                <input type="checkbox" checked={offerForm.is_active} onChange={e => setOfferForm({ ...offerForm, is_active: e.target.checked })} />
                <span className="text-sm font-medium">{ar ? 'العرض فعال' : 'Offer active'}</span>
              </label>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => run('offer-save', () => offerId === 'new' ? createOffer(normalizedOffer()) : updateOffer(offerId!, normalizedOffer()))}
                loading={busy === 'offer-save'}
              >
                {ar ? 'حفظ العرض' : 'Save offer'}
              </Button>
              <Button variant="secondary" onClick={() => { setOfferId(null); setOfferForm(emptyOffer()) }}>
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border/60 mt-4">
          {offers.length === 0 ? (
            <p className="text-sm text-text-muted py-4">{ar ? 'لا توجد عروض بعد' : 'No offers yet'}</p>
          ) : offers.map(offer => (
            <div key={offer.id} className="py-3 flex items-start gap-3 justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground">{ar ? offer.title_ar : offer.title_en}</h3>
                  <Badge variant={offer.is_active ? 'success' : 'neutral'}>{offer.is_active ? (ar ? 'فعال' : 'Active') : (ar ? 'متوقف' : 'Off')}</Badge>
                  <Badge variant="neutral">{tierName(offer.target_tier, lang)}</Badge>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  {offer.points_cost > 0 ? `${offer.points_cost} ${ar ? 'نقطة' : 'pts'}` : (ar ? 'بدون تكلفة نقاط' : 'No point cost')}
                  {offer.reward_points > 0 ? ` · +${offer.reward_points} ${ar ? 'نقطة' : 'pts'}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="soft" size="sm" onClick={() => startOffer(offer)}>{ar ? 'تعديل' : 'Edit'}</Button>
                <Button variant="danger" size="sm" onClick={() => run(`delete-offer-${offer.id}`, () => deleteOffer(offer.id))} loading={busy === `delete-offer-${offer.id}`}>{ar ? 'حذف' : 'Delete'}</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading
          icon={<CalendarDays size={18} />}
          title={ar ? 'أيام النقاط المضاعفة' : 'Double-point days'}
          subtitle={ar ? 'أي كوب في هذا اليوم يأخذ أعلى مضاعف فعال.' : 'Any cup on that date uses the highest active multiplier.'}
        />
        <div className="grid sm:grid-cols-5 gap-3 mt-4 items-end">
          <Field label={ar ? 'العنوان عربي' : 'Arabic title'}><input value={doubleForm.title_ar} onChange={e => setDoubleForm({ ...doubleForm, title_ar: e.target.value })} className={inputClass} /></Field>
          <Field label={ar ? 'العنوان إنجليزي' : 'English title'}><input value={doubleForm.title_en} onChange={e => setDoubleForm({ ...doubleForm, title_en: e.target.value })} className={inputClass} /></Field>
          <Field label={ar ? 'اليوم' : 'Day'}><input type="date" value={doubleForm.day} onChange={e => setDoubleForm({ ...doubleForm, day: e.target.value })} className={inputClass} dir="ltr" /></Field>
          <Field label={ar ? 'المضاعف' : 'Multiplier'}><input type="number" min="1" step="0.25" value={doubleForm.multiplier} onChange={e => setDoubleForm({ ...doubleForm, multiplier: Number(e.target.value) })} className={inputClass} dir="ltr" /></Field>
          <Button onClick={() => run('double-create', () => createDoublePointDay(doubleForm))} loading={busy === 'double-create'}>
            {ar ? 'إضافة' : 'Add'}
          </Button>
        </div>
        <div className="divide-y divide-border/60 mt-4">
          {doubleDays.length === 0 ? (
            <p className="text-sm text-text-muted py-4">{ar ? 'لا توجد أيام مضاعفة' : 'No double-point days'}</p>
          ) : doubleDays.map(day => (
            <div key={day.id} className="py-3 flex justify-between gap-3 items-center">
              <div>
                <p className="font-bold">{ar ? day.title_ar : day.title_en}</p>
                <p className="text-sm text-text-muted" dir="ltr">{day.day} · x{day.multiplier}</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => run(`double-delete-${day.id}`, () => deleteDoublePointDay(day.id))} loading={busy === `double-delete-${day.id}`}>
                {ar ? 'حذف' : 'Delete'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading
          icon={<WalletCards size={18} />}
          title={ar ? 'تعديل نقاط عميل' : 'Adjust customer points'}
          subtitle={ar ? 'استخدمها للتعويضات أو التصحيح اليدوي. اكتب قيمة سالبة للخصم.' : 'Use this for compensation or corrections. Enter a negative value to subtract.'}
        />
        <div className="grid sm:grid-cols-[2fr_1fr_2fr_auto] gap-3 mt-4 items-end">
          <Field label={ar ? 'العميل' : 'Customer'}>
            <select value={adjustForm.customerId} onChange={e => setAdjustForm({ ...adjustForm, customerId: e.target.value })} className={inputClass}>
              <option value="">{ar ? 'اختر العميل' : 'Select customer'}</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} · {customer.loyalty_accounts?.points_balance ?? 0} {ar ? 'نقطة' : 'pts'} · {customer.loyalty_accounts?.referral_code ?? '—'}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ar ? 'النقاط' : 'Points'}>
            <input value={adjustForm.points} onChange={e => setAdjustForm({ ...adjustForm, points: e.target.value })} type="number" className={inputClass} dir="ltr" />
          </Field>
          <Field label={ar ? 'السبب' : 'Reason'}>
            <input value={adjustForm.description} onChange={e => setAdjustForm({ ...adjustForm, description: e.target.value })} className={inputClass} placeholder={ar ? 'مثال: تعويض عميل' : 'e.g. customer compensation'} />
          </Field>
          <Button
            onClick={() => run('adjust', () => adjustCustomerPoints(adjustForm.customerId, Number(adjustForm.points), adjustForm.description))}
            loading={busy === 'adjust'}
          >
            {ar ? 'تعديل' : 'Adjust'}
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHeading
          icon={<Sparkles size={18} />}
          title={ar ? 'آخر حركة نقاط' : 'Recent point activity'}
          subtitle={ar ? 'مفيد لمراجعة أن التسجيلات والعروض تعمل صح.' : 'Useful for checking that redemptions and offers are working.'}
        />
        <div className="divide-y divide-border/60 mt-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-text-muted py-4">{ar ? 'لا توجد حركات بعد' : 'No activity yet'}</p>
          ) : transactions.map(tx => (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{tx.profiles?.full_name ?? '—'}</p>
                <p className="text-sm text-text-muted truncate">{tx.description || tx.type}</p>
              </div>
              <div className="text-end shrink-0">
                <p className={`font-bold tabular-nums ${tx.points >= 0 ? 'text-success' : 'text-danger'}`}>{tx.points > 0 ? '+' : ''}{tx.points}</p>
                <p className="text-xs text-text-muted" dir="ltr">{new Date(tx.created_at).toLocaleDateString(ar ? 'ar-OM' : 'en-OM')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums mt-2">{value}</p>
    </Card>
  )
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">{icon}</span>
      <div>
        <h2 className="text-lg font-bold text-foreground m-0">{title}</h2>
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  )
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
      <span>{label}</span>
      {children}
    </label>
  )
}
