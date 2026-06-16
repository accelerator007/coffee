import { ReactNode } from 'react'

interface ListRowProps {
  /** Single character/emoji shown inside the brown thumbnail square */
  thumb?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** Right-aligned content (badge, value, action) */
  trailing?: ReactNode
  className?: string
}

export default function ListRow({ thumb, title, subtitle, trailing, className = '' }: ListRowProps) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      {thumb !== undefined && (
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand-gradient text-background flex items-center justify-center text-lg font-bold shadow-sm">
          {thumb}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground truncate">{title}</p>
        {subtitle && <p className="text-sm text-text-muted truncate">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 flex items-center gap-2">{trailing}</div>}
    </div>
  )
}
