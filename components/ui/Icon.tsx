import type { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  size?: number
  className?: string
  /** Provide a label to expose the icon to screen readers; otherwise it is hidden as decorative. */
  label?: string
}

/**
 * Thin wrapper around lucide-react icons that enforces a consistent size and
 * stroke width across the app, and sane accessibility defaults:
 * - decorative icons (no label) are aria-hidden
 * - labelled icons expose an accessible name
 */
export default function Icon({ icon: LucideComp, size = 20, className = '', label }: IconProps) {
  return (
    <LucideComp
      size={size}
      strokeWidth={1.75}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  )
}
