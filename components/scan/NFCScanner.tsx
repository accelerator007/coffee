'use client'

import { useEffect, useState } from 'react'
import { Nfc } from 'lucide-react'
import { Lang } from '@/lib/i18n'
import Button from '@/components/ui/Button'

interface Props {
  onScan: (value: string) => void
  lang: Lang
}

export default function NFCScanner({ onScan, lang }: Props) {
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const [nfcReading, setNfcReading] = useState(false)
  const [manualId, setManualId] = useState('')

  const ar = lang === 'ar'

  useEffect(() => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setNfcSupported(false)
      return
    }
    setNfcSupported(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reader = new (window as any).NDEFReader()
    reader.scan()
      .then(() => {
        setNfcReading(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reader.onreading = (event: any) => {
          const record = event.message.records[0]
          if (!record) return
          const text = new TextDecoder().decode(record.data)
          onScan(text)
        }
      })
      .catch(() => {
        setNfcSupported(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {nfcSupported === true && nfcReading && (
        <div className="flex flex-col items-center gap-3 py-6 rounded-2xl bg-surface border border-border">
          <Nfc size={48} strokeWidth={1.5} className="text-brand animate-pulse" aria-hidden />
          <p className="text-text-muted text-sm text-center">
            {ar ? 'قرّب بطاقة NFC من الهاتف...' : 'Hold NFC card near phone...'}
          </p>
        </div>
      )}

      {nfcSupported === false && (
        <p className="text-sm text-amber-600 text-center">
          {ar ? 'NFC غير مدعوم على هذا الجهاز' : 'NFC not supported on this device'}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          {ar ? 'أو أدخل رقم البطاقة يدوياً' : 'Or enter card number manually'}
        </label>
        <div className="flex gap-2">
          <input
            value={manualId}
            onChange={e => setManualId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && manualId.trim() && onScan(manualId.trim())}
            placeholder={ar ? 'رقم بطاقة NFC' : 'NFC card number'}
            aria-label={ar ? 'رقم بطاقة NFC' : 'NFC card number'}
            dir="ltr"
            className="flex-1 min-h-11 px-4 rounded-2xl border border-border bg-surface text-foreground
              focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <Button
            onClick={() => manualId.trim() && onScan(manualId.trim())}
            disabled={!manualId.trim()}
            className="min-h-11 px-5"
          >
            {ar ? 'بحث' : 'Search'}
          </Button>
        </div>
      </div>
    </div>
  )
}
