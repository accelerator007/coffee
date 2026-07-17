'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { QrCode, Nfc, ScanLine, TriangleAlert, CircleCheck } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import { getCustomerByQR, nfcRedeem, recordRedemption } from '@/app/scan/actions'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import SegmentedTabs from '@/components/ui/SegmentedTabs'
import NFCScanner from './NFCScanner'

const QRScanner = dynamic(() => import('./QRScanner'), { ssr: false })

type CustomerData = Awaited<ReturnType<typeof getCustomerByQR>>
type Tab = 'qr' | 'nfc'
type State = 'scanning' | 'loading' | 'result' | 'success' | 'nfc_success' | 'error'
type NFCResult = { customerName: string; packageName: string; remaining: number; daysLeft: number; pointsEarned?: number }

export default function ScanClient({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState<Tab>('nfc')
  const [state, setState] = useState<State>('scanning')
  const [data, setData] = useState<CustomerData | null>(null)
  const [nfcResult, setNfcResult] = useState<NFCResult | null>(null)
  const [pointsEarned, setPointsEarned] = useState(0)
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
        if (result.error === 'invalid_nfc') setErrorMsg(ar ? 'البطاقة غير مسجلة في النظام' : 'Card is not registered')
        else if (result.error === 'card_blocked') setErrorMsg(ar ? 'البطاقة محظورة' : 'Card is blocked')
        else if (result.error === 'card_lost') setErrorMsg(ar ? 'البطاقة مبلّغ عنها كمفقودة' : 'Card reported lost')
        else if (result.error === 'card_unassigned') setErrorMsg(ar ? 'البطاقة غير مرتبطة بعميل' : 'Card not linked to a customer')
        else if (result.error === 'no_subscription') setErrorMsg(ar ? 'لا يوجد اشتراك لهذا العميل' : 'Customer has no subscription')
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
        setPointsEarned(result.pointsEarned ?? 0)
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
    setPointsEarned(0)
    setErrorMsg('')
  }

  if (state === 'scanning') {
    return (
      <div className="flex flex-col gap-5">
        <SegmentedTabs
          block
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          tabs={[
            { value: 'qr', label: 'QR', icon: <QrCode size={16} aria-hidden /> },
            { value: 'nfc', label: 'NFC', icon: <Nfc size={16} aria-hidden /> },
          ]}
        />

        {tab === 'qr' && (
          <Card variant="warm" className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[280px] mx-auto">
              <QRScanner
                onScan={handleScan}
                onError={() => { setErrorMsg(ar ? 'لا يمكن الوصول للكاميرا' : 'Camera access denied'); setState('error') }}
              />
            </div>
            <p className="text-center text-text-muted text-[13px]">{t('alignQr', lang)}</p>
          </Card>
        )}

        {tab === 'nfc' && (
          <Card variant="warm">
            <NFCScanner onScan={handleNFCScan} lang={lang} />
          </Card>
        )}
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-8 h-8 border-[3px] border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <TriangleAlert size={56} strokeWidth={1.5} className="text-danger" aria-hidden />
        <p role="alert" className="text-danger font-semibold">{errorMsg}</p>
        <Button onClick={reset} variant="secondary">{t('scanAgain', lang)}</Button>
      </Card>
    )
  }

  if (state === 'nfc_success' && nfcResult) {
    return (
      <Card variant="feature" className="flex flex-col items-center gap-3 py-10 text-center animate-fade-up">
        <CircleCheck size={80} strokeWidth={1.5} className="text-foreground" aria-hidden />
        <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{nfcResult.customerName}</h3>
        <p className="text-text-muted text-sm">{nfcResult.packageName}</p>
        <div className="flex gap-8 mt-2">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{nfcResult.remaining}</span>
            <span className="text-xs text-text-muted">{ar ? 'كوب متبقي اليوم' : 'cups left today'}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{nfcResult.daysLeft}</span>
            <span className="text-xs text-text-muted">{ar ? 'يوم متبقي' : 'days left'}</span>
          </div>
        </div>
        <Badge variant="success" dot className="mt-2">{t('cupLogged', lang)}</Badge>
        {(nfcResult.pointsEarned ?? 0) > 0 && (
          <p className="text-sm font-semibold text-success">
            +{nfcResult.pointsEarned} {ar ? 'نقطة ولاء' : 'loyalty points'}
          </p>
        )}
      </Card>
    )
  }

  if (state === 'success') {
    return (
      <Card variant="feature" className="flex flex-col items-center gap-4 py-10 text-center animate-fade-up">
        <CircleCheck size={80} strokeWidth={1.5} className="text-foreground" aria-hidden />
        <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{t('cupRedeemed', lang)}</h3>
        <p className="text-success font-semibold text-sm">{t('redemptionSuccess', lang)}</p>
        {pointsEarned > 0 && (
          <Badge variant="success" dot>
            +{pointsEarned} {lang === 'ar' ? 'نقطة ولاء' : 'loyalty points'}
          </Badge>
        )}
        <Button onClick={reset}>{t('scanAgain', lang)}</Button>
      </Card>
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
        <h3 className="font-semibold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t('customerInfo', lang)}</h3>
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">{t('name', lang)}</span>
            <span className="font-semibold text-foreground">{data.customer.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">{t('phone', lang)}</span>
            <span className="font-semibold text-foreground" dir="ltr">{data.customer.phone ?? '—'}</span>
          </div>
          {pkg && (
            <div className="flex justify-between items-center">
              <span className="text-text-muted">{t('packageName', lang)}</span>
              <span className="font-semibold text-foreground">{pkg.name}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-text-muted">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
            <Badge status={isActive ? 'active' : 'expired'} label={t(isActive ? 'active' : 'expired', lang)} />
          </div>
          {isActive && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">{t('daysLeft', lang)}</span>
                <span className="font-semibold text-foreground">{data.daysLeft}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">{lang === 'ar' ? 'كوبات متبقية اليوم' : 'Cups left today'}</span>
                <span className={`font-bold ${remaining === 0 ? 'text-danger' : 'text-success'}`}>
                  {remaining} / {pkg?.daily_allowance}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleRecord} loading={recording} disabled={!canRedeem} className="flex-1">
          <ScanLine size={18} aria-hidden />
          {t('recordRedemption', lang)}
        </Button>
        <Button onClick={reset} variant="secondary">{t('scanAgain', lang)}</Button>
      </div>

      {!canRedeem && isActive && remaining === 0 && (
        <p className="text-center text-sm text-danger">{t('limitReached', lang)}</p>
      )}
    </div>
  )
}
