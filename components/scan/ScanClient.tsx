'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Lang, t } from '@/lib/i18n'
import { getCustomerByQR, getCustomerByNFC, recordRedemption } from '@/app/scan/actions'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NFCScanner from './NFCScanner'

const QRScanner = dynamic(() => import('./QRScanner'), { ssr: false })

type CustomerData = Awaited<ReturnType<typeof getCustomerByQR>>
type Tab = 'qr' | 'nfc'
type State = 'scanning' | 'loading' | 'result' | 'success' | 'error'

export default function ScanClient({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState<Tab>('qr')
  const [state, setState] = useState<State>('scanning')
  const [data, setData] = useState<CustomerData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [recording, setRecording] = useState(false)
  const ar = lang === 'ar'

  const handleScan = useCallback(async (value: string) => {
    setState('loading')
    try {
      const result = await getCustomerByQR(value.trim())
      if ('error' in result && result.error === 'invalid_qr') {
        setErrorMsg(t('invalidQR', lang))
        setState('error')
        return
      }
      setData(result)
      setState('result')
    } catch {
      setErrorMsg(ar ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again')
      setState('error')
    }
  }, [lang, ar])

  const handleNFCScan = useCallback(async (value: string) => {
    setState('loading')
    try {
      const result = await getCustomerByNFC(value.trim())
      if ('error' in result && result.error === 'invalid_nfc') {
        setErrorMsg(ar ? 'بطاقة NFC غير مرتبطة بأي عميل' : 'NFC card not linked to any customer')
        setState('error')
        return
      }
      setData(result as CustomerData)
      setState('result')
    } catch {
      setErrorMsg(ar ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again')
      setState('error')
    }
  }, [ar])

  async function handleRecord() {
    if (!data?.subscription || !data?.customer) return
    setRecording(true)
    try {
      const result = await recordRedemption(data.subscription.id, data.customer.id)
      setRecording(false)
      if ('error' in result) {
        if (result.error === 'limit_reached') setErrorMsg(t('limitReached', lang))
        else if (result.error === 'expired') setErrorMsg(lang === 'ar' ? 'الاشتراك منتهي' : 'Subscription expired')
        else setErrorMsg(t('error', lang))
        setState('error')
      } else {
        setState('success')
      }
    } catch {
      setRecording(false)
      setErrorMsg(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again')
      setState('error')
    }
  }

  function reset() {
    setState('scanning')
    setData(null)
    setErrorMsg('')
  }

  if (state === 'scanning') {
    return (
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          <button
            onClick={() => setTab('qr')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'qr' ? 'bg-brand text-white' : 'bg-surface text-text-muted hover:text-foreground'
            }`}
          >
            {ar ? '📷 رمز QR' : '📷 QR Code'}
          </button>
          <button
            onClick={() => setTab('nfc')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'nfc' ? 'bg-brand text-white' : 'bg-surface text-text-muted hover:text-foreground'
            }`}
          >
            {ar ? '📡 بطاقة NFC' : '📡 NFC Card'}
          </button>
        </div>

        {tab === 'qr' && (
          <>
            <p className="text-center text-text-muted text-sm">{t('scanInstruction', lang)}</p>
            <QRScanner onScan={handleScan} onError={() => { setErrorMsg(ar ? 'لا يمكن الوصول للكاميرا' : 'Camera access denied'); setState('error') }} />
          </>
        )}

        {tab === 'nfc' && (
          <NFCScanner onScan={handleNFCScan} lang={lang} />
        )}
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="text-5xl">⚠️</div>
        <p className="text-red-600 font-medium">{errorMsg}</p>
        <Button onClick={reset} variant="secondary">{t('scanAgain', lang)}</Button>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="text-6xl">✅</div>
        <p className="text-green-700 font-semibold text-lg">{t('redemptionSuccess', lang)}</p>
        <Button onClick={reset}>{t('scanAgain', lang)}</Button>
      </div>
    )
  }

  // state === 'result'
  if (!data?.customer) return null
  const pkg = data.subscription?.packages as { name: string; daily_allowance: number } | undefined
  const isActive = (data.daysLeft ?? 0) > 0
  const remaining = pkg ? (pkg.daily_allowance - (data.todayUsed ?? 0)) : 0
  const canRedeem = isActive && remaining > 0

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="font-semibold text-lg mb-3">{t('customerInfo', lang)}</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">{t('name', lang)}</span>
            <span className="font-medium">{data.customer.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">{t('phone', lang)}</span>
            <span className="font-medium" dir="ltr">{data.customer.phone ?? '—'}</span>
          </div>
          {pkg && (
            <div className="flex justify-between">
              <span className="text-text-muted">{t('packageName', lang)}</span>
              <span className="font-medium">{pkg.name}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-text-muted">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
            <Badge status={isActive ? 'active' : 'expired'} label={t(isActive ? 'active' : 'expired', lang)} />
          </div>
          {isActive && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">{t('daysLeft', lang)}</span>
                <span className="font-medium">{data.daysLeft}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{lang === 'ar' ? 'كوبات متبقية اليوم' : 'Cups left today'}</span>
                <span className={`font-semibold ${remaining === 0 ? 'text-red-500' : 'text-green-700'}`}>
                  {remaining} / {pkg?.daily_allowance}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleRecord}
          loading={recording}
          disabled={!canRedeem}
          className="flex-1"
        >
          {t('recordRedemption', lang)}
        </Button>
        <Button onClick={reset} variant="secondary">
          {t('scanAgain', lang)}
        </Button>
      </div>

      {!canRedeem && isActive && remaining === 0 && (
        <p className="text-center text-sm text-red-500">{t('limitReached', lang)}</p>
      )}
    </div>
  )
}
