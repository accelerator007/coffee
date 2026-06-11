import { Lang, t } from '@/lib/i18n'

interface Props {
  used: number
  total: number
  lang: Lang
}

export default function DailyAllowance({ used, total, lang }: Props) {
  const remaining = Math.max(0, total - used)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-foreground">{t('dailyAllowance', lang)}</h3>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
              ${i < used ? 'bg-muted text-text-muted' : 'bg-brand text-white'}`}
          >
            ☕
          </div>
        ))}
      </div>
      <p className="text-sm text-text-muted">
        <span className="font-semibold text-brand text-lg">{remaining}</span>
        {' '}{t('cupsRemaining', lang)}
      </p>
    </div>
  )
}
