'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Camera, Nfc, TriangleAlert, CircleCheck } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import { getCustomerByQR, nfcRedeem, recordRedemption } from '@/app/scan/actions'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NFCScanner from './NFCScanner'

const QRScanner = dynamic(() => import('./QRScanner'), { ssr: false })

type CustomerData = Awaited<ReturnType<typeof getCustomerByQR>>
type Tab = 'qr' | 'nfc'
type State = 'scanning' | 'loading' | 'result' | 'success' | 'nfc_success' | 'error'
type NFCResult = { customerName: string; packageName: string; remaining: number; daysLeft: number }

export default function ScanClient({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState<Tab>('qr')
  const [state, setState] = useState<State>('scanning')
  const [data, setData] = useState<CustomerData | null>(null)
  const [nfcResult, setNfcResult] = useState<NFCResult | null>(null)
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
      const result = await nfcRedeem(value.trim())
      if ('error' in result) {
        if (result.error === 'invalid_nfc') setErrorMsg(ar ? 'بطاقة NFC غير مرتبطة بأي عميل' : 'NFC card not linked to any customer')
        else if (result.error === 'expired') setErrorMsg(ar ? 'الاشتراك منتهي' : 'Subscription expired')
        else if (result.error === 'limit_reached') setErrorMsg(ar ? 'وصلت للحد اليومي' : 'Daily limit reached')
        else setErrorMsg(ar ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again')
        setState('error')
        return
      }
      setNfcResult(result)
      setState('nfc_success')
      setTimeout(() => { setState('scanning'); setNfcResult(null) }, 3000)
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
    setNfcResult(null)
    setErrorMsg('')
  }

  if (state === 'scanning') {
    return (
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-border">
          <button
            onClick={() => setTab('qr')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
              tab === 'qr' ? 'bg-brand text-white' : 'bg-surface text-text-muted hover:text-foreground'
            }`}
          >
            <Camera size={18} strokeWidth={1.75} aria-hidden />
            {ar ? 'رمز QR' : 'QR Code'}
          </button>
          <button
            onClick={() => setTab('nfc')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
              tab === 'nfc' ? 'bg-brand text-white' : 'bg-surface text-text-muted hover:text-foreground'
            }`}
          >
            <Nfc size={18} strokeWidth={1.75} aria-hidden />
            {ar ? 'بطاقة NFC' : 'NFC Card'}
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
        <TriangleAlert size={56} strokeWidth={1.5} className="text-danger" aria-hidden />
        <p role="alert" className="text-danger font-medium">{errorMsg}</p>
        <Button onClick={reset} variant="secondary">{t('scanAgain', lang)}</Button>
      </div>
    )
  }

  if (state === 'nfc_success' && nfcResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CircleCheck size={64} strokeWidth={1.5} className="text-success" aria-hidden />
        <p className="text-success font-semibold text-xl">{nfcResult.customerName}</p>
        <p className="text-text-muted text-sm">{nfcResult.packageName}</p>
        <div className="flex gap-6 mt-2">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-brand">{nfcResult.remaining}</span>
            <span className="text-xs text-text-muted">{ar ? 'كوب متبقي اليوم' : 'cups left today'}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-brand">{nfcResult.daysLeft}</span>
            <span className="text-xs text-text-muted">{ar ? 'يوم متبقي' : 'days left'}</span>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-2">{ar ? 'سيتم المسح مجدداً خلال ثوانٍ...' : 'Ready to scan again shortly...'}</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CircleCheck size={64} strokeWidth={1.5} className="text-success" aria-hidden />
        <p className="text-success font-semibold text-lg">{t('redemptionSuccess', lang)}</p>
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
                <span className={`font-semibold ${remaining === 0 ? 'text-danger' : 'text-success'}`}>
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
        <p className="text-center text-sm text-danger">{t('limitReached', lang)}</p>
      )}
    </div>
  )
}
