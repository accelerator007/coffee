'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Gift, Sparkles, Ticket, Users } from 'lucide-react'
import { Lang } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import TierBadge from '@/components/ui/TierBadge'
import { claimOfferAction, markNotificationRead } from '@/app/dashboard/actions'

type Summary = {
  points_balance: number
  lifetime_points: number
  tier_slug: string
  tier_name_ar: string
  tier_name_en: string
  next_tier_slug: string | null
  next_tier_name_ar: string | null
  next_tier_name_en: string | null
  points_to_next: number
  referral_code: string
  birth_date: string | null
}

type Offer = {
  id: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  badge_ar: string
  badge_en: string
  points_cost: number
  reward_points: number
  already_claimed: boolean
  can_claim: boolean
}

type Notification = {
  id: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  kind: string
  read_at: string | null
  created_at: string
}

export default function LoyaltyRewards({
  lang,
  summary,
  offers,
  notifications,
}: {
  lang: Lang
  summary: Summary | null
  offers: Offer[]
  notifications: Notification[]
}) {
  const router = useRouter()
  const ar = lang === 'ar'
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  if (!summary) return null

  const currentTierName = ar ? summary.tier_name_ar : summary.tier_name_en
  const nextTierName = ar ? summary.next_tier_name_ar : summary.next_tier_name_en
  const progressMax = summary.next_tier_slug ? summary.lifetime_points + summary.points_to_next : summary.lifetime_points || 1
  const progressValue = summary.next_tier_slug ? summary.lifetime_points : progressMax

  async function claimOffer(id: string) {
    setBusy(id)
    setMessage('')
    const result = await claimOfferAction(id)
    setBusy('')
    if (result.error) {
      setMessage(result.error)
      return
    }
    if (result.status === 'success') setMessage(ar ? 'تم تفعيل العرض' : 'Offer claimed')
    else if (result.status === 'not_enough_points') setMessage(ar ? 'نقاطك غير كافية' : 'Not enough points')
    else if (result.status === 'already_claimed') setMessage(ar ? 'العرض مستخدم مسبقاً' : 'Offer already claimed')
    else setMessage(ar ? 'تعذّر تفعيل العرض' : 'Could not claim offer')
    router.refresh()
  }

  async function markRead(id: string) {
    setBusy(id)
    await markNotificationRead(id)
    setBusy('')
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-5">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Sparkles size={17} strokeWidth={1.75} aria-hidden />
              <span>{ar ? 'نقاط الولاء' : 'Loyalty points'}</span>
            </div>
            <p className="text-4xl font-black text-foreground tabular-nums mt-2" style={{ fontFamily: 'var(--font-display)' }}>
              {summary.points_balance}
            </p>
          </div>
          <div className="text-end">
            <TierBadge tier={summary.tier_slug} lang={lang} />
            <p className="text-xs text-text-muted mt-2">{currentTierName}</p>
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar value={progressValue} max={progressMax} />
          <p className="text-xs text-text-muted mt-2">
            {summary.next_tier_slug
              ? (ar ? `${summary.points_to_next} نقطة للوصول إلى ${nextTierName}` : `${summary.points_to_next} points to ${nextTierName}`)
              : (ar ? 'وصلت أعلى مستوى' : 'Top tier reached')}
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-muted p-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Users size={16} strokeWidth={1.75} aria-hidden />
            {ar ? 'كود الإحالة' : 'Referral code'}
          </span>
          <span className="font-mono text-sm font-bold" dir="ltr">{summary.referral_code}</span>
        </div>
      </Card>

      {offers.length > 0 && (
        <div>
          <SectionTitle icon={<Ticket size={17} strokeWidth={1.75} />} title={ar ? 'العروض' : 'Offers'} />
          <div className="flex flex-col gap-3">
            {offers.map(offer => (
              <Card key={offer.id} variant="warm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {(ar ? offer.badge_ar : offer.badge_en) && (
                      <Badge variant="accent">{ar ? offer.badge_ar : offer.badge_en}</Badge>
                    )}
                    <h3 className="font-bold text-foreground mt-2">{ar ? offer.title_ar : offer.title_en}</h3>
                    <p className="text-sm text-text-muted mt-1">{ar ? offer.body_ar : offer.body_en}</p>
                    <p className="text-xs text-text-muted mt-2">
                      {offer.points_cost > 0 ? `${offer.points_cost} ${ar ? 'نقطة' : 'points'}` : (ar ? 'بدون تكلفة نقاط' : 'No point cost')}
                      {offer.reward_points > 0 ? ` · +${offer.reward_points} ${ar ? 'نقطة' : 'points'}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={offer.already_claimed ? 'soft' : 'primary'}
                    disabled={offer.already_claimed || !offer.can_claim}
                    loading={busy === offer.id}
                    onClick={() => claimOffer(offer.id)}
                    className="shrink-0"
                  >
                    {offer.already_claimed ? (ar ? 'مفعل' : 'Claimed') : (ar ? 'تفعيل' : 'Claim')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div>
          <SectionTitle icon={<Bell size={17} strokeWidth={1.75} />} title={ar ? 'الإشعارات' : 'Notifications'} />
          <div className="flex flex-col gap-3">
            {notifications.map(note => (
              <Card key={note.id} className={note.read_at ? 'opacity-70' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {note.kind === 'reward' && <Gift size={16} strokeWidth={1.75} aria-hidden />}
                      {ar ? note.title_ar : note.title_en}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">{ar ? note.body_ar : note.body_en}</p>
                  </div>
                  {!note.read_at && (
                    <Button variant="soft" size="sm" loading={busy === note.id} onClick={() => markRead(note.id)}>
                      {ar ? 'تم' : 'Read'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {message && <p className="text-sm font-semibold text-success text-center">{message}</p>}
    </section>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-foreground">
      <span className="inline-flex">{icon}</span>
      <h3 className="text-[18px] font-semibold text-foreground m-0" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
    </div>
  )
}
