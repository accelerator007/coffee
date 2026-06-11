'use client'

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (value: string) => void
  onError?: (err: string) => void
}

export default function QRScanner({ onScan, onError }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const divId = 'qr-reader'

  useEffect(() => {
    const scanner = new Html5Qrcode(divId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onScan(decodedText)
        scanner.stop().catch(() => {})
      },
      () => {}
    ).catch((err: unknown) => {
      onError?.(String(err))
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-black">
      <div id={divId} className="w-full" />
    </div>
  )
}
