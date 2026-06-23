'use client'

import { Lang } from '@/lib/i18n'

interface DayCount { day: string; count: number }

/**
 * District 7 cups-per-day bar chart. Bars grow on mount (staggered); the most
 * recent day is highlighted in solid ink, the rest in neutral grey.
 */
export default function RedemptionChart({ data, lang }: { data: DayCount[]; lang: Lang }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const locale = lang === 'ar' ? 'ar' : 'en'
  const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: 'short', timeZone: 'Asia/Muscat' })

  return (
    <div className="flex items-end gap-2.5 sm:gap-3.5 h-44 mt-4">
      {data.map(({ day, count }, i) => {
        const isLast = i === data.length - 1
        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="text-[11px] font-bold text-text-muted tabular-nums">{count}</div>
            <div
              className={`w-full max-w-[40px] origin-bottom rounded-t-[10px] rounded-b-[4px] ${isLast ? 'bg-foreground' : 'bg-[#d4d4d4]'}`}
              style={{
                height: `${Math.max(4, (count / max) * 120)}px`,
                animation: 'd7grow 0.8s var(--ease-out) both',
                animationDelay: `${i * 0.07}s`,
              }}
              title={`${day}: ${count}`}
            />
            <div className="text-[13px] text-text-muted">{dayLabel(day)}</div>
          </div>
        )
      })}
    </div>
  )
}
