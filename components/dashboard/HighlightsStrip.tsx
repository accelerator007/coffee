import { Coffee } from 'lucide-react'

// Decorative "feed" — flat bordered tiles (no live Instagram integration).
const HIGHLIGHTS = ['Pour-over', 'Beans', 'Latte art', 'V60', 'The space', 'Espresso']

export default function HighlightsStrip() {
  return (
    <div className="flex gap-3 overflow-x-auto px-[18px] pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {HIGHLIGHTS.map((label) => (
        <figure key={label} className="m-0 shrink-0 w-[116px] text-center">
          <div className="w-[116px] h-[116px] rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center text-text-muted/50">
            <Coffee size={34} strokeWidth={1.25} aria-hidden />
          </div>
          <figcaption className="text-[13px] text-text-muted mt-1.5">{label}</figcaption>
        </figure>
      ))}
    </div>
  )
}
