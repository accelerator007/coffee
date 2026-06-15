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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-latte uppercase mb-0.5">
            {lang === 'ar' ? 'الباقة الحالية' : 'Current Plan'}
          </p>
          <h2 className="font-black text-xl text-foreground">{packageName}</h2>
        </div>
        <Badge
          status={isActive ? 'active' : 'expired'}
          label={t(isActive ? 'active' : 'expired', lang)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">{t('daysLeft', lang)}</span>
          <span className="font-bold text-brand text-base">{Math.max(0, daysLeft)}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #c98a3c, #6f4e37)' }}
          />
        </div>
      </div>
    </div>
  )
}
