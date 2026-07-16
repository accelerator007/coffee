'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces
 * the whole document, so it ships its own <html>/<body> and inline styles rather
 * than depending on globals.css (which the failed layout would have provided).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 24,
          textAlign: 'center',
          background: '#faf7f2',
          color: '#1c1917',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Tahoma, sans-serif',
        }}
      >
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fde8e8', color: '#c0392b',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>تعذّر تحميل الصفحة</h1>
          <p style={{ margin: 0, color: '#78716c' }}>صار خطأ مؤقّت في الخادم. جرّب مرة ثانية بعد لحظات.</p>
          <p style={{ margin: 0, color: '#78716c', fontSize: 14 }}>A server error occurred. Please try again.</p>
        </div>

        <button
          onClick={() => reset()}
          style={{
            minHeight: 44, padding: '0 24px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: '#1c1917', color: '#faf7f2', fontWeight: 700, fontSize: 15,
          }}
        >
          إعادة المحاولة · Retry
        </button>

        {error.digest && (
          <p style={{ fontSize: 12, color: '#a8a29e', fontFamily: 'monospace' }} dir="ltr">Ref: {error.digest}</p>
        )}
      </body>
    </html>
  )
}
