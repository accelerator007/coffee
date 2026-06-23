import { Gift } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { tierLabel } from '@/components/ui/TierBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { Lang, t } from '@/lib/i18n'

interface Props {
  packageName: string
  tier?: string | null
  daysLeft: number
  totalDays: number
  startDate?: string
  lang: Lang
}

export default function SubscriptionCard({ packageName, tier, daysLeft, totalDays, startDate, lang }: Props) {
  const isActive = daysLeft > 0
  const elapsed = Math.max(0, Math.min(totalDays, totalDays - daysLeft))
  const since = startDate
    ? new Date(startDate).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { month: 'short', year: 'numeric' })
    : null
  const label = tierLabel(tier, lang) ?? t('currentPlan', lang)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-[46px] h-[46px] rounded-xl shrink-0 inline-flex items-center justify-center bg-foreground text-background">
          <Gift size={22} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {packageName}
          </h2>
          <p className="text-[13px] text-text-muted truncate">
            {label}
            {since && <> · {t('memberSince', lang)} {since}</>}
          </p>
        </div>
        <Badge status={isActive ? 'active' : 'expired'} label={t(isActive ? 'active' : 'expired', lang)} />
      </div>

      <ProgressBar
        label={t('daysLeft', lang)}
        value={elapsed}
        max={totalDays}
        valueText={`${Math.max(0, daysLeft)} / ${totalDays}`}
      />
    </div>
  )
}
