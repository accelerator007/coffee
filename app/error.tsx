'use client'

import { useEffect } from 'react'

/**
 * Segment error boundary for everything under the root layout. Server
 * components here (the admin dashboard, cards, customers, dashboard, scan)
 * fetch from Supabase at request time; if that call rejects — e.g. the project
 * is briefly unreachable — the route would otherwise crash into the host's raw
 * "server error" page. This catches it and offers a retry instead. Next still
 * handles redirect()/notFound() internally, so auth redirects keep working.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaces in the Netlify function log with the same digest shown below.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center bg-background text-foreground">
      <div className="w-16 h-16 rounded-full bg-danger-bg text-danger flex items-center justify-center">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          تعذّر تحميل الصفحة
        </h1>
        <p className="text-text-muted">صار خطأ مؤقّت في الخادم. جرّب مرة ثانية بعد لحظات.</p>
        <p className="text-text-muted text-sm">A server error occurred. Please try again.</p>
      </div>

      <button
        onClick={reset}
        className="min-h-11 px-6 rounded-full bg-brand text-background font-bold hover:bg-brand-dark transition-colors"
      >
        إعادة المحاولة · Retry
      </button>

      {error.digest && (
        <p className="text-xs text-text-muted/60 font-mono" dir="ltr">Ref: {error.digest}</p>
      )}
    </div>
  )
}
