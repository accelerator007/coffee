'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  ltr?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, ltr, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        dir={ltr ? 'ltr' : undefined}
        className={`
          w-full min-h-11 px-4 rounded-2xl border bg-[#fdfaf5]
          text-foreground placeholder:text-text-muted
          border-border focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/20 focus:border-brand
          transition-colors
          ${error ? 'border-red-400 focus:ring-red-200' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
})

export default Input
