import { Coffee } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'

interface Props {
  used: number
  total: number
  lang: Lang
}

export default function DailyAllowance({ used, total, lang }: Props) {
  const remaining = Math.max(0, total - used)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold tracking-widest text-latte uppercase mb-0.5">
          {lang === 'ar' ? 'اليوم' : 'Today'}
        </p>
        <h3 className="font-black text-xl text-foreground">{t('dailyAllowance', lang)}</h3>
      </div>
      <div className="flex gap-3 flex-wrap">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all
              ${i < used
                ? 'bg-muted text-text-muted opacity-40'
                : 'bg-accent-gradient text-white shadow-[0_2px_8px_rgba(201,138,60,0.35)]'
              }`}
          >
            <Coffee size={22} strokeWidth={1.75} aria-hidden />
          </div>
        ))}
      </div>
      <p className="text-sm text-text-muted">
        <span className="font-black text-accent text-2xl">{remaining}</span>
        {'  '}{t('cupsRemaining', lang)}
      </p>
    </div>
  )
}
