'use client'

import { useEffect, useRef, useState } from 'react'
import { Nfc } from 'lucide-react'
import { Lang } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import { decodeCardUid } from '@/components/scan/NFCScanner'

interface Props {
  onRead: (uid: string) => void
  lang: Lang
}

/**
 * One-shot NFC capture for admin forms. Web NFC only exists on Android Chrome
 * over HTTPS, so this renders nothing when unsupported — typing the card
 * number stays the primary path.
 */
export default function NFCReadButton({ onRead, lang }: Props) {
  const [supported, setSupported] = useState(false)
  const [reading, setReading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const ar = lang === 'ar'

  useEffect(() => {
    if ('NDEFReader' in window) {
      const id = requestAnimationFrame(() => setSupported(true))
      return () => cancelAnimationFrame(id)
    }
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function startScan() {
    if (reading) {
      abortRef.current?.abort()
      setReading(false)
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reader = new (window as any).NDEFReader()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reader.onreading = (event: any) => {
        const uid = decodeCardUid(event)
        controller.abort()
        setReading(false)
        if (uid) onRead(uid)
      }
      await reader.scan({ signal: controller.signal })
      setReading(true)
    } catch {
      setReading(false)
    }
  }

  if (!supported) return null

  return (
    <Button
      type="button"
      variant="soft"
      onClick={startScan}
      className="min-h-11 px-4 shrink-0"
      aria-label={ar ? 'امسح البطاقة' : 'Scan card'}
      title={ar ? 'امسح البطاقة' : 'Scan card'}
    >
      <Nfc size={18} strokeWidth={1.75} className={reading ? 'animate-pulse' : ''} aria-hidden />
      {reading ? (ar ? 'قرّب البطاقة...' : 'Hold card...') : (ar ? 'مسح' : 'Scan')}
    </Button>
  )
}
