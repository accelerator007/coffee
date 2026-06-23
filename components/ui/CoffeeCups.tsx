/**
 * Daily-cup tracker — a row of minimal outline cup tokens. Remaining cups are
 * crisp ink outlines; consumed cups fade to faint grey. (District 7)
 */
function CupGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-[22px] h-[22px] block">
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M5 9h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
      <path d="M5 21h12" />
      <path d="M8.5 3.5c.5.6.5 1.4 0 2M11.5 3.5c.5.6.5 1.4 0 2" />
    </svg>
  )
}

export default function CoffeeCups({ total = 5, used = 0, className = '' }: { total?: number; used?: number; className?: string }) {
  const cups = Array.from({ length: total }, (_, i) => i < used)
  return (
    <div
      className={`flex flex-wrap gap-3 ${className}`}
      role="img"
      aria-label={`${total - used} of ${total} cups remaining today`}
    >
      {cups.map((done, i) => (
        <span
          key={i}
          className={`w-11 h-11 rounded-xl inline-flex items-center justify-center border transition-colors ${
            done ? 'text-[#cfcfcf] border-border' : 'text-foreground border-foreground'
          }`}
        >
          <CupGlyph />
        </span>
      ))}
    </div>
  )
}
