'use client'

import { ReactNode, useLayoutEffect, useRef, useState } from 'react'

export interface TabItem {
  value: string
  label: ReactNode
  icon?: ReactNode
}

interface Props {
  tabs: TabItem[]
  value: string
  onChange: (value: string) => void
  block?: boolean
  className?: string
}

/**
 * Segmented pill toggle with a sliding solid-ink thumb. Used for
 * Customer/Staff, QR/NFC, etc. (District 7)
 */
export default function SegmentedTabs({ tabs, value, onChange, block = false, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)
  const idx = Math.max(0, tabs.findIndex((t) => t.value === value))

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const btn = wrap.querySelectorAll<HTMLButtonElement>('[role="tab"]')[idx]
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [idx, tabs, block])

  return (
    <div
      ref={wrapRef}
      role="tablist"
      className={`relative ${block ? 'flex w-full' : 'inline-flex'} gap-1 p-[5px] rounded-full bg-muted ${className}`}
    >
      {thumb && (
        <span
          aria-hidden
          className="absolute top-[5px] bottom-[5px] rounded-full bg-brand transition-[left,width] duration-300 ease-[var(--ease-out)]"
          style={{ left: thumb.left, width: thumb.width }}
        />
      )}
      {tabs.map((t) => {
        const selected = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.value)}
            className={`relative z-[1] flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors duration-300 focus-visible:outline-none ${
              selected ? 'text-background' : 'text-text-muted'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
