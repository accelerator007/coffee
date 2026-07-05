'use client'

import { useEffect, useRef, useState } from 'react'
import { ScanLine, PencilLine, Eraser } from 'lucide-react'
import { Lang, t, TranslationKey } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import { decodeCardUid } from '@/components/scan/NFCScanner'

interface Props {
  uid: string
  lang: Lang
  onRead: (uid: string) => void
}

type Action = 'read' | 'write' | 'erase'
type Message = { key: TranslationKey; kind: 'info' | 'success' | 'error' } | null

/**
 * The three physical-tag operations for a card, done over Web NFC:
 *   - Read:  scan an existing tag and pull its code into the field.
 *   - Write: program the current code onto the tag (a text record, so a later
 *            read/till-scan decodes back the same value via decodeCardUid).
 *   - Erase: wipe the tag by writing a single empty NDEF record.
 *
 * Web NFC only works on Android Chrome over HTTPS. Unlike a self-hiding button,
 * the three actions are always shown so the operator sees them everywhere; on an
 * unsupported device a tap just explains that a phone is needed.
 */
export default function NFCCardActions({ uid, lang, onRead }: Props) {
  const [busy, setBusy] = useState<Action | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  function supported() {
    return typeof window !== 'undefined' && 'NDEFReader' in window
  }

  async function run(action: Action) {
    // Tapping the in-progress action again cancels it.
    if (busy === action) {
      abortRef.current?.abort()
      setBusy(null)
      setMessage(null)
      return
    }
    setMessage(null)

    if (!supported()) {
      setMessage({ key: 'nfcUnsupported', kind: 'info' })
      return
    }
    if (action === 'write' && !uid.trim()) {
      setMessage({ key: 'nfcNeedNumber', kind: 'error' })
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(action)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()

      if (action === 'read') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ndef.onreading = (event: any) => {
          const value = decodeCardUid(event)
          controller.abort()
          setBusy(null)
          if (value) {
            onRead(value)
            setMessage({ key: 'nfcReadDone', kind: 'success' })
          } else {
            setMessage({ key: 'nfcEmptyCard', kind: 'error' })
          }
        }
        await ndef.scan({ signal: controller.signal })
        setMessage({ key: 'nfcHoldRead', kind: 'info' })
        return
      }

      setMessage({ key: action === 'write' ? 'nfcHoldWrite' : 'nfcHoldErase', kind: 'info' })
      await ndef.write(
        action === 'write'
          ? { records: [{ recordType: 'text', data: uid.trim() }] }
          : { records: [{ recordType: 'empty' }] },
        { signal: controller.signal },
      )
      setBusy(null)
      setMessage({ key: action === 'write' ? 'nfcWriteDone' : 'nfcEraseDone', kind: 'success' })
    } catch {
      setBusy(null)
      setMessage({ key: 'nfcFailed', kind: 'error' })
    }
  }

  const msgColor =
    message?.kind === 'error' ? 'text-danger'
    : message?.kind === 'success' ? 'text-brand'
    : 'text-text-muted'

  // A different action running locks the other two; the active one stays
  // clickable so it can be cancelled.
  const locked = (action: Action) => busy !== null && busy !== action

  return (
    <div className="flex flex-col gap-2" aria-label={t('nfcActions', lang)}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button" variant="soft"
          onClick={() => run('read')}
          disabled={locked('read')}
          className="min-h-11 px-4 flex-1 min-w-[6rem]"
        >
          <ScanLine size={18} strokeWidth={1.75} className={busy === 'read' ? 'animate-pulse' : ''} aria-hidden />
          {t('readCard', lang)}
        </Button>
        <Button
          type="button" variant="soft"
          onClick={() => run('write')}
          disabled={!uid.trim() || locked('write')}
          className="min-h-11 px-4 flex-1 min-w-[6rem]"
        >
          <PencilLine size={18} strokeWidth={1.75} className={busy === 'write' ? 'animate-pulse' : ''} aria-hidden />
          {t('writeCard', lang)}
        </Button>
        <Button
          type="button" variant="soft"
          onClick={() => run('erase')}
          disabled={locked('erase')}
          className="min-h-11 px-4 flex-1 min-w-[6rem] text-danger"
        >
          <Eraser size={18} strokeWidth={1.75} className={busy === 'erase' ? 'animate-pulse' : ''} aria-hidden />
          {t('eraseCard', lang)}
        </Button>
      </div>
      {message && (
        <p role="status" className={`text-xs ${msgColor}`}>{t(message.key, lang)}</p>
      )}
    </div>
  )
}
