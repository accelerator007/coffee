'use client'

import { useEffect, useRef, useState } from 'react'
import { PencilLine } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import Button from '@/components/ui/Button'

interface Props {
  uid: string
  lang: Lang
}

type WriteState = 'idle' | 'writing' | 'done' | 'error'

/**
 * Writes the current card UID onto a physical NFC tag. Web NFC only exists on
 * Android Chrome over HTTPS, so — like NFCReadButton — this renders nothing when
 * unsupported; on those devices you generate a number and read it off a tag
 * that already carries one instead. The UID is written as a single NDEF text
 * record, matching decodeCardUid's precedence so a later scan reads it back.
 */
export default function NFCWriteButton({ uid, lang }: Props) {
  const [supported, setSupported] = useState(false)
  // Result is tied to the UID it applies to, so editing/regenerating the number
  // clears the "written ✓" badge without a state-resetting effect.
  const [result, setResult] = useState<{ status: WriteState; uid: string }>({ status: 'idle', uid: '' })
  const abortRef = useRef<AbortController | null>(null)

  const ar = lang === 'ar'
  const value = uid.trim()
  const state: WriteState = result.uid === value ? result.status : 'idle'

  useEffect(() => {
    if ('NDEFReader' in window) {
      const id = requestAnimationFrame(() => setSupported(true))
      return () => cancelAnimationFrame(id)
    }
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function startWrite() {
    if (!value || state === 'writing') return

    const controller = new AbortController()
    abortRef.current = controller
    setResult({ status: 'writing', uid: value })
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()
      await ndef.write(
        { records: [{ recordType: 'text', data: value }] },
        { signal: controller.signal },
      )
      setResult({ status: 'done', uid: value })
    } catch {
      setResult({ status: 'error', uid: value })
    }
  }

  if (!supported) return null

  const label =
    state === 'writing' ? (ar ? 'قرّب البطاقة...' : 'Hold card...')
    : state === 'done' ? (ar ? 'تمت الكتابة ✓' : 'Written ✓')
    : state === 'error' ? (ar ? 'فشلت الكتابة' : 'Write failed')
    : t('writeCard', lang)

  return (
    <Button
      type="button"
      variant="soft"
      onClick={startWrite}
      disabled={!uid.trim()}
      className="min-h-11 px-4 shrink-0"
      aria-label={t('writeCard', lang)}
      title={t('writeCard', lang)}
    >
      <PencilLine
        size={18}
        strokeWidth={1.75}
        className={state === 'writing' ? 'animate-pulse' : ''}
        aria-hidden
      />
      {label}
    </Button>
  )
}
