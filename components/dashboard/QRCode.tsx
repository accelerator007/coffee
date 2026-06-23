'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      // Monochrome: ink modules on pure white (District 7).
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      })
    }
  }, [value, size])

  return (
    <div className="inline-flex justify-center rounded-xl bg-surface-warm p-3.5">
      <canvas ref={canvasRef} className="rounded-lg block" />
    </div>
  )
}
