'use client'

import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
}

// District 7: solid-black primary that shifts to grey #333 on hover, flat
// hairline-bordered secondary, fully-rounded pills. Soft lift / press, no bounce.
const variants: Record<Variant, string> = {
  primary:   'bg-brand text-background hover:bg-brand-dark hover:-translate-y-px active:scale-[0.985]',
  secondary: 'bg-surface text-foreground ring-1 ring-inset ring-border hover:bg-muted hover:ring-[var(--border-strong)] active:scale-[0.985]',
  soft:      'bg-muted text-foreground hover:bg-border active:scale-[0.985]',
  danger:    'bg-danger text-white hover:opacity-90 active:scale-[0.985]',
  ghost:     'text-brand hover:bg-muted',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-4 text-sm',
  md: 'min-h-11 px-6 text-[15px]',
  lg: 'min-h-[52px] px-7 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full font-bold whitespace-nowrap
        transition-[transform,background-color,box-shadow,opacity] duration-200 ease-[var(--ease-out)]
        focus-visible:outline-none focus-visible:shadow-[var(--shadow-glow)]
        disabled:opacity-45 disabled:cursor-not-allowed disabled:translate-y-0
        ${sizes[size]} ${variants[variant]} ${block ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  )
}
