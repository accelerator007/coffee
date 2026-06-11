import Badge from '@/components/ui/Badge'
import { Lang, t } from '@/lib/i18n'

interface Props {
  packageName: string
  daysLeft: number
  totalDays: number
  lang: Lang
}

export default function SubscriptionCard({ packageName, daysLeft, totalDays, lang }: Props) {
  const isActive = daysLeft > 0
  const progress = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-foreground">{packageName}</h2>
        <Badge
          status={isActive ? 'active' : 'expired'}
          label={t(isActive ? 'active' : 'expired', lang)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm text-text-muted">
          <span>{t('daysLeft', lang)}</span>
          <span className="font-medium text-foreground">{Math.max(0, daysLeft)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
