'use client'

import { useEffect, useRef } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (value: string) => void
  onError?: (err: string) => void
}

export default function QRScanner({ onScan, onError }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const divId = 'qr-reader'

  useEffect(() => {
    let cancelled = false
    let started = false

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const scanner = new Html5Qrcode(divId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {}
        )
        started = true
      } catch (err: unknown) {
        if (!cancelled) onError?.(String(err))
      }
    }

    startScanner()

    return () => {
      cancelled = true
      if (started) scannerRef.current?.stop().catch(() => {})
      try {
        scannerRef.current?.clear()
      } catch {
        // Ignore cleanup errors from scanner instances that never fully mounted.
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-black">
      <div id={divId} className="w-full" />
    </div>
  )
}
