'use client'

import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-brand text-background shadow-sm hover:bg-brand-dark active:scale-[0.97]',
  secondary: 'border border-brand text-brand bg-transparent hover:bg-brand hover:text-background active:scale-[0.97]',
  soft:      'bg-muted text-brand hover:bg-border active:scale-[0.97]',
  danger:    'bg-danger text-white hover:opacity-90 active:scale-[0.97]',
  ghost:     'text-brand hover:bg-muted',
}

export default function Button({
  variant = 'primary',
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
        min-h-11 px-6 rounded-full font-semibold text-base
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
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
