interface Props {
  label: string
  value: number | string
  icon: string
  color?: string
}

export default function KPICard({ label, value, icon, color = 'text-accent' }: Props) {
  return (
    <div className="bg-surface border border-border rounded-3xl p-4 flex flex-col gap-2 shadow-[0_2px_12px_rgba(111,78,55,0.07)]">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs font-semibold tracking-wide uppercase">{label}</span>
        <span className="text-xl w-9 h-9 flex items-center justify-center rounded-2xl bg-muted">{icon}</span>
      </div>
      <span className={`text-3xl font-black ${color}`} style={{ fontFamily: 'var(--font-heading)' }}>{value}</span>
    </div>
  )
}
