'use client'

import { InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  ltr?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, ltr, className = '', id, ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        dir={ltr ? 'ltr' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full min-h-11 px-4 rounded-2xl border bg-background
          text-foreground placeholder:text-text-muted
          border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand
          transition-colors
          ${error ? 'border-danger focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
