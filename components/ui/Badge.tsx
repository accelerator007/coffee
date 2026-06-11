type Status = 'active' | 'expired'

const styles: Record<Status, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-700',
}

export default function Badge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      {label}
    </span>
  )
}
