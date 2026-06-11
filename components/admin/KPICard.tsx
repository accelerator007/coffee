interface Props {
  label: string
  value: number | string
  icon: string
  color?: string
}

export default function KPICard({ label, value, icon, color = 'text-brand' }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
    </div>
  )
}
