import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-2xl shadow-sm border border-border p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
