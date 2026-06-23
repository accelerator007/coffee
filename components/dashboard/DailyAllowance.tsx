import CoffeeCups from '@/components/ui/CoffeeCups'
import { Lang, t } from '@/lib/i18n'

interface Props {
  used: number
  total: number
  lang: Lang
}

export default function DailyAllowance({ used, total, lang }: Props) {
  const remaining = Math.max(0, total - used)

  return (
    <div className="flex items-center justify-between gap-4">
      <CoffeeCups total={total} used={used} />
      <div className="text-end shrink-0">
        <div className="text-foreground leading-none" style={{ font: 'var(--type-display)' }}>{remaining}</div>
        <div className="text-[13px] text-text-muted mt-1">{t('leftToday', lang)}</div>
      </div>
    </div>
  )
}
