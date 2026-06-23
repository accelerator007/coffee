import Badge from '@/components/ui/Badge'
import { Lang, t, type TranslationKey } from '@/lib/i18n'

export type Tier = 'gold' | 'silver' | 'bronze'

const meta: Record<Tier, { key: TranslationKey; variant: 'accent' | 'neutral' }> = {
  // The top tier gets the outlined-ink "accent" pill; others stay neutral.
  gold:   { key: 'tierGold', variant: 'accent' },
  silver: { key: 'tierSilver', variant: 'neutral' },
  bronze: { key: 'tierBronze', variant: 'neutral' },
}

/** Localized tier name, or null when the package has no tier set. */
export function tierLabel(tier: string | null | undefined, lang: Lang): string | null {
  if (!tier || !(tier in meta)) return null
  return t(meta[tier as Tier].key, lang)
}

/** Renders a plan-tier pill, or nothing when the package has no tier set. */
export default function TierBadge({ tier, lang, className }: { tier?: string | null; lang: Lang; className?: string }) {
  if (!tier || !(tier in meta)) return null
  const m = meta[tier as Tier]
  return (
    <Badge variant={m.variant} className={className}>
      {t(m.key, lang)}
    </Badge>
  )
}
