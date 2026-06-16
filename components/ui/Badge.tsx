import { CircleCheck, CircleX } from 'lucide-react'

type Status = 'active' | 'expired'

const styles: Record<Status, string> = {
  active:  'bg-success-bg text-success',
  expired: 'bg-danger-bg text-danger',
}

const icons: Record<Status, typeof CircleCheck> = {
  active:  CircleCheck,
  expired: CircleX,
}

export default function Badge({ status, label }: { status: Status; label: string }) {
  const StatusIcon = icons[status]
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      <StatusIcon size={14} strokeWidth={2} aria-hidden />
      {label}
    </span>
  )
}
