import { HTMLAttributes } from 'react'

type Variant = 'default' | 'warm' | 'feature'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  // Flat, hairline-bordered surfaces — no resting shadow (District 7).
  default: 'bg-surface border-border',
  warm:    'bg-surface-warm border-border',
  // Featured cards use a solid ink border instead of a glow.
  feature: 'bg-surface-warm border-foreground',
}

export default function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
