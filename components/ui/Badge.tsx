type Status = 'active' | 'expired'

const styles: Record<Status, string> = {
  active:  'bg-[#e6f4ec] text-[#2d6a4f]',
  expired: 'bg-[#fce8e8] text-[#9b2335]',
}

export default function Badge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      {label}
    </span>
  )
}
