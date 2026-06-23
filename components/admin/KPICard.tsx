'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: number
  icon: LucideIcon
  prefix?: string
  suffix?: string
  decimals?: number
  /** Optional period-over-period delta (percent). Renders an up/down chip. */
  delta?: number | null
}

function useCountUp(target: number, duration = 1100) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // All updates happen inside the rAF callback (never synchronously in the
    // effect body) so we don't trigger cascading renders.
    if (reduce) {
      const id = requestAnimationFrame(() => setN(target))
      return () => cancelAnimationFrame(id)
    }
    let raf = 0
    let start: number | undefined
    const tick = (ts: number) => {
      if (start === undefined) start = ts
      const p = Math.min(1, (ts - start) / duration)
      setN(p < 1 ? target * (1 - Math.pow(1 - p, 3)) : target)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return n
}

export default function KPICard({ label, value, icon: IconComp, prefix = '', suffix = '', decimals = 0, delta = null }: Props) {
  const n = useCountUp(Number(value) || 0)
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="w-[42px] h-[42px] rounded-xl shrink-0 inline-flex items-center justify-center bg-accent text-background">
          <IconComp size={22} strokeWidth={1.75} aria-hidden />
        </span>
        {delta != null && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${delta >= 0 ? 'text-success bg-success-bg' : 'text-danger bg-danger-bg'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="text-[32px] font-black text-foreground leading-none tabular-nums tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {prefix}{formatted}{suffix}
      </div>
      <div className="text-[13px] font-bold text-text-muted">{label}</div>
    </div>
  )
}
