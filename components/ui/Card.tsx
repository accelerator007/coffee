import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-3xl shadow-[0_2px_16px_rgba(111,78,55,0.08)] border border-border p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
