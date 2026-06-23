'use client'

import { useEffect, useState } from 'react'

interface Props {
  value?: number
  max?: number
  label?: string
  valueText?: string
  showValue?: boolean
  className?: string
}

/**
 * Solid-ink progress fill on a grey track, animating from 0 → value on mount.
 * (District 7)
 */
export default function ProgressBar({ value = 0, max = 100, label, valueText, showValue = true, className = '' }: Props) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))
  const [w, setW] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-baseline gap-3 mb-2">
          {label && <span className="text-[13px] font-bold text-brand">{label}</span>}
          {showValue && (
            <span className="text-[13px] font-extrabold text-accent tabular-nums">
              {valueText ?? `${value} / ${max}`}
            </span>
          )}
        </div>
      )}
      <div
        className="h-3 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-[var(--ease-out)]"
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  )
}
