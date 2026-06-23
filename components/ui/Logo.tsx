import Image from 'next/image'

type Variant = 'circle' | 'mono'

interface Props {
  size?: number
  variant?: Variant
  bordered?: boolean
  /** Show the spaced serif "District 7" wordmark beside the mark. */
  wordmark?: boolean
  className?: string
}

const SRC: Record<Variant, string> = {
  circle: '/logo-district7-circle.png',
  mono: '/logo-d7-mono.png',
}

/**
 * District 7 brand mark — the official circular logo (or monogram crop),
 * with an optional spaced serif wordmark lockup. (District 7)
 */
export default function Logo({ size = 40, variant = 'mono', bordered = false, wordmark = false, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={SRC[variant]}
        alt="District 7"
        width={size}
        height={size}
        priority
        className={`rounded-full object-cover ${bordered ? 'border border-border' : ''}`}
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <strong
          className="font-semibold uppercase text-foreground whitespace-nowrap"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: size * 0.42 }}
        >
          District&nbsp;7
        </strong>
      )}
    </span>
  )
}
