'use client'

import { Lang, t } from '@/lib/i18n'

interface DayCount { day: string; count: number }

export default function RedemptionChart({ data, lang }: { data: DayCount[]; lang: Lang }) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-foreground">{t('trend', lang)}</h3>
      <div className="flex items-end gap-0.5 h-24">
        {data.map(({ day, count }) => (
          <div
            key={day}
            title={`${day}: ${count}`}
            className="flex-1 bg-brand rounded-t-sm hover:bg-brand-dark transition-colors cursor-default"
            style={{ height: `${Math.max(4, (count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>{data[0]?.day?.slice(5)}</span>
        <span>{data[data.length - 1]?.day?.slice(5)}</span>
      </div>
    </div>
  )
}
