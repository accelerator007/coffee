'use client'

import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  ltr?: boolean
  /** Fixed leading affix, e.g. the +968 phone prefix. */
  prefix?: ReactNode
  /** Fixed trailing affix. */
  affix?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, ltr, prefix, affix, className = '', id, ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className={`text-sm font-bold ${error ? 'text-danger' : 'text-brand'}`}>
          {label}
        </label>
      )}
      <div
        className={`
          flex items-center gap-2.5 px-4 min-h-[50px] rounded-xl bg-surface
          border-[1.5px] transition-colors
          ${error
            ? 'border-danger focus-within:border-danger'
            : 'border-border focus-within:border-brand focus-within:shadow-[var(--shadow-glow)]'}
        `}
      >
        {prefix && <span className="text-text-muted text-[15px] font-bold whitespace-nowrap">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          dir={ltr ? 'ltr' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-text-muted/80 py-3 ${className}`}
          {...props}
        />
        {affix && <span className="text-text-muted text-[15px] font-bold whitespace-nowrap">{affix}</span>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
