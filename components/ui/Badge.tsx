import { CircleCheck, CircleX } from 'lucide-react'
import type { ReactNode } from 'react'

type Status = 'active' | 'expired'
type Variant = 'neutral' | 'brand' | 'accent' | 'success' | 'danger'

const variantStyles: Record<Variant, string> = {
  neutral: 'bg-muted text-foreground',
  brand:   'bg-brand text-background',
  // Outlined ink pill — used for the top plan tier (Gold).
  accent:  'bg-transparent text-foreground ring-1 ring-inset ring-foreground',
  success: 'bg-success-bg text-success',
  danger:  'bg-danger-bg text-danger',
}

const statusToVariant: Record<Status, Variant> = {
  active:  'success',
  expired: 'danger',
}

interface BadgeProps {
  /** Legacy subscription-status API (renders a check / x icon). */
  status?: Status
  label?: string
  /** Generic pill API. */
  variant?: Variant
  dot?: boolean
  children?: ReactNode
  className?: string
}

export default function Badge({ status, label, variant, dot, children, className = '' }: BadgeProps) {
  const resolved: Variant = variant ?? (status ? statusToVariant[status] : 'neutral')
  const base = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${variantStyles[resolved]} ${className}`

  // Legacy status badge keeps its leading icon.
  if (status && !children) {
    const StatusIcon = status === 'active' ? CircleCheck : CircleX
    return (
      <span className={base}>
        <StatusIcon size={14} strokeWidth={2} aria-hidden />
        {label}
      </span>
    )
  }

  return (
    <span className={base}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />}
      {children ?? label}
    </span>
  )
}
