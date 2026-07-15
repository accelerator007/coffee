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
type Message = { text: string; kind: 'info' | 'success' | 'error' } | null

export default function NFCCardActions({ uid, lang, onRead }: Props) {
  const [busy, setBusy] = useState<Action | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  function translated(key: TranslationKey) {
    return t(key, lang)
  }

  function supported() {
    return typeof window !== 'undefined' && window.isSecureContext && 'NDEFReader' in window
  }

  function describeError(error: unknown) {
    if (error instanceof DOMException) {
      if (error.name === 'AbortError') return null
      if (error.name === 'NotAllowedError') {
        return lang === 'ar' ? 'تم رفض إذن NFC. اسمح بالوصول ثم حاول مجدداً.' : 'NFC permission was denied. Allow access and try again.'
      }
      if (error.name === 'NotSupportedError') {
        return lang === 'ar' ? 'هذه البطاقة أو العملية غير مدعومة.' : 'This card or operation is not supported.'
      }
      if (error.name === 'NetworkError') {
        return lang === 'ar' ? 'تعذر الاتصال بالبطاقة. قرّبها وثبّتها ثم حاول مجدداً.' : 'Could not communicate with the card. Hold it steady and try again.'
      }
    }
    return translated('nfcFailed')
  }

  async function run(action: Action) {
    if (busy === action) {
      abortRef.current?.abort()
      setBusy(null)
      setMessage(null)
      return
    }

    setMessage(null)

    if (!supported()) {
      setMessage({ text: translated('nfcUnsupported'), kind: 'info' })
      return
    }

    if (action === 'write' && !uid.trim()) {
      setMessage({ text: translated('nfcNeedNumber'), kind: 'error' })
      return
    }

    if (action === 'erase') {
      const confirmed = window.confirm(
        lang === 'ar'
          ? 'سيتم مسح محتوى بطاقة NFC نهائياً. هل أنت متأكد؟'
          : 'This will permanently erase the NFC card contents. Continue?',
      )
      if (!confirmed) return
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
            setMessage({ text: translated('nfcReadDone'), kind: 'success' })
          } else {
            setMessage({ text: translated('nfcEmptyCard'), kind: 'error' })
          }
        }
        await ndef.scan({ signal: controller.signal })
        setMessage({ text: translated('nfcHoldRead'), kind: 'info' })
        return
      }

      setMessage({ text: translated(action === 'write' ? 'nfcHoldWrite' : 'nfcHoldErase'), kind: 'info' })
      await ndef.write(
        action === 'write'
          ? { records: [{ recordType: 'text', data: uid.trim() }] }
          : { records: [{ recordType: 'empty' }] },
        { signal: controller.signal },
      )
      setBusy(null)
      setMessage({ text: translated(action === 'write' ? 'nfcWriteDone' : 'nfcEraseDone'), kind: 'success' })
    } catch (error) {
      setBusy(null)
      const text = describeError(error)
      if (text) setMessage({ text, kind: 'error' })
    }
  }

  const msgColor =
    message?.kind === 'error' ? 'text-danger'
    : message?.kind === 'success' ? 'text-brand'
    : 'text-text-muted'

  const locked = (action: Action) => busy !== null && busy !== action

  return (
    <div className="flex flex-col gap-2" aria-label={translated('nfcActions')}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="soft" onClick={() => run('read')} disabled={locked('read')} className="min-h-11 px-4 flex-1 min-w-[6rem]">
          <ScanLine size={18} strokeWidth={1.75} className={busy === 'read' ? 'animate-pulse' : ''} aria-hidden />
          {translated('readCard')}
        </Button>
        <Button type="button" variant="soft" onClick={() => run('write')} disabled={!uid.trim() || locked('write')} className="min-h-11 px-4 flex-1 min-w-[6rem]">
          <PencilLine size={18} strokeWidth={1.75} className={busy === 'write' ? 'animate-pulse' : ''} aria-hidden />
          {translated('writeCard')}
        </Button>
        <Button type="button" variant="soft" onClick={() => run('erase')} disabled={locked('erase')} className="min-h-11 px-4 flex-1 min-w-[6rem] text-danger">
          <Eraser size={18} strokeWidth={1.75} className={busy === 'erase' ? 'animate-pulse' : ''} aria-hidden />
          {translated('eraseCard')}
        </Button>
      </div>
      {message && <p role="status" aria-live="polite" className={`text-xs ${msgColor}`}>{message.text}</p>}
    </div>
  )
}
