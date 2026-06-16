'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRCodeDisplay({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: 220,
        margin: 2,
        color: { dark: '#6B3F1F', light: '#FDF6EC' }
      })
    }
  }, [value])

  return (
    <div className="flex justify-center p-4">
      <canvas ref={canvasRef} className="rounded-2xl" />
    </div>
  )
}
