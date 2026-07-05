'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Pencil, Nfc, Sparkles } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import {
  createCard, updateCard, assignCard, unassignCard, setCardStatus, deleteCard,
  generateCardUid, type CardRow, type CardStatus,
} from './actions'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ListRow from '@/components/ui/ListRow'
import NFCReadButton from '@/components/admin/NFCReadButton'
import NFCWriteButton from '@/components/admin/NFCWriteButton'

type Customer = { id: string; full_name: string; phone: string }

interface Props {
  lang: Lang
  cards: CardRow[]
  customers: Customer[]
}

const statusVariant: Record<CardStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  unassigned: 'neutral',
  lost: 'danger',
  blocked: 'danger',
}

export default function CardsClient({ lang, cards, customers }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  // Add / edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ card_uid: '', label: '', customer_id: '' })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const ar = lang === 'ar'

  const inputClass = `w-full min-h-11 px-4 rounded-2xl border border-border bg-surface text-foreground
    placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand`

  // A card whose customer disappeared (deleted account) behaves as unassigned.
  function effectiveStatus(card: CardRow): CardStatus {
    return card.customer === null && card.status === 'active' ? 'unassigned' : card.status
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? cards.filter(c =>
        c.card_uid.toLowerCase().includes(q) ||
        (c.label ?? '').toLowerCase().includes(q) ||
        (c.customer?.full_name ?? '').toLowerCase().includes(q) ||
        (c.customer?.phone ?? '').toLowerCase().includes(q))
    : cards

  function startNew() {
    setEditingId('new')
    setForm({ card_uid: '', label: '', customer_id: '' })
    setConfirmDelete(false)
    setError('')
  }

  function startEdit(card: CardRow) {
    setEditingId(card.id)
    setForm({
      card_uid: card.card_uid,
      label: card.label ?? '',
      customer_id: card.customer?.id ?? '',
    })
    setConfirmDelete(false)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setConfirmDelete(false)
    setError('')
  }

  function localizeError(result: { error?: string }) {
    if (result.error === 'duplicate') return t('cardExists', lang)
    if (result.error === 'empty') return ar ? 'أدخل رقم البطاقة' : 'Enter the card number'
    return result.error || t('error', lang)
  }

  async function handleSave() {
    setError('')
    if (!form.card_uid.trim()) {
      setError(ar ? 'أدخل رقم البطاقة' : 'Enter the card number')
      return
    }
    setSaving(true)

    if (editingId === 'new') {
      const result = await createCard({
        card_uid: form.card_uid,
        customer_id: form.customer_id || null,
        label: form.label,
      })
      setSaving(false)
      if ('error' in result && result.error) { setError(localizeError(result)); return }
    } else if (editingId) {
      const card = cards.find(c => c.id === editingId)
      const result = await updateCard(editingId, { card_uid: form.card_uid, label: form.label })
      if ('error' in result && result.error) {
        setSaving(false)
        setError(localizeError(result))
        return
      }
      // Apply customer link changes made in the same panel.
      const prevCustomer = card?.customer?.id ?? ''
      if (form.customer_id !== prevCustomer) {
        const linkResult = form.customer_id
          ? await assignCard(editingId, form.customer_id)
          : await unassignCard(editingId)
        if ('error' in linkResult && linkResult.error) {
          setSaving(false)
          setError(localizeError(linkResult))
          return
        }
      }
      setSaving(false)
    }

    cancelEdit()
    router.refresh()
  }

  async function handleGenerate() {
    setError('')
    setGenerating(true)
    const result = await generateCardUid()
    setGenerating(false)
    const uid = 'uid' in result ? result.uid : undefined
    if (uid) {
      setForm(f => ({ ...f, card_uid: uid }))
    } else {
      setError(t('error', lang))
    }
  }

  async function handleStatus(id: string, status: Exclude<CardStatus, 'unassigned'>) {
    setError('')
    const result = await setCardStatus(id, status)
    if ('error' in result && result.error) {
      setError(result.error === 'unassigned'
        ? (ar ? 'اربط البطاقة بعميل أولاً' : 'Link the card to a customer first')
        : localizeError(result))
      return
    }
    cancelEdit()
    router.refresh()
  }

  async function handleDelete() {
    if (!editingId || editingId === 'new') return
    setError('')
    setDeleting(true)
    const result = await deleteCard(editingId)
    setDeleting(false)
    if ('error' in result && result.error) { setError(localizeError(result)); return }
    cancelEdit()
    router.refresh()
  }

  function statusLabel(status: CardStatus) {
    if (status === 'active') return t('active', lang)
    if (status === 'lost') return t('lost', lang)
    if (status === 'blocked') return t('blocked', lang)
    return t('unassigned', lang)
  }

  function renderForm(card: CardRow | null) {
    const currentStatus = card ? effectiveStatus(card) : null
    return (
      <div className="py-4 flex flex-col gap-3">
        {card === null && (
          <h3 className="font-semibold">{t('addCard', lang)}</h3>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('cardNumber', lang)}</label>
          <div className="flex flex-wrap gap-2">
            <input
              value={form.card_uid}
              onChange={e => setForm({ ...form, card_uid: e.target.value })}
              placeholder={ar ? 'ولّد رقماً أو اقرأ البطاقة أو اكتبه' : 'Generate, read card, or type'}
              className={`${inputClass} font-mono flex-1 min-w-[10rem]`}
              dir="ltr"
            />
            <Button
              type="button"
              variant="soft"
              onClick={handleGenerate}
              loading={generating}
              className="min-h-11 px-4 shrink-0"
              aria-label={t('generateId', lang)}
              title={t('generateId', lang)}
            >
              <Sparkles size={18} strokeWidth={1.75} aria-hidden />
              {t('generateId', lang)}
            </Button>
            <NFCWriteButton lang={lang} uid={form.card_uid} />
            <NFCReadButton lang={lang} onRead={uid => setForm(f => ({ ...f, card_uid: uid }))} />
          </div>
          <p className="text-xs text-text-muted">
            {ar
              ? 'بطاقة جديدة: ولّد رقماً ثم اضغط «كتابة على البطاقة» لبرمجة الشريحة. بطاقة قديمة فيها رقم: اضغط «قراءة البطاقة»'
              : 'New card: generate a number, then tap "Write to card" to program the tag. Old card with a code: tap "Read card"'}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {t('cardLabel', lang)}
            <span className="text-text-muted font-normal"> ({ar ? 'اختياري' : 'optional'})</span>
          </label>
          <input
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
            placeholder={ar ? 'مثال: بطاقة بديلة' : 'e.g. Replacement card'}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('linkedCustomer', lang)}</label>
          <select
            value={form.customer_id}
            onChange={e => setForm({ ...form, customer_id: e.target.value })}
            className={inputClass}
          >
            <option value="">{ar ? '— بدون عميل —' : '— No customer —'}</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Status controls — existing cards only */}
        {card && currentStatus && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{ar ? 'الحالة' : 'Status'}</label>
            <div className="flex gap-2 flex-wrap">
              {currentStatus !== 'active' && (
                <Button
                  variant="soft" size="sm"
                  onClick={() => handleStatus(card.id, 'active')}
                  disabled={!card.customer && !form.customer_id}
                >
                  {t('activateCard', lang)}
                </Button>
              )}
              {currentStatus !== 'lost' && (
                <Button variant="soft" size="sm" onClick={() => handleStatus(card.id, 'lost')}>
                  {t('lost', lang)}
                </Button>
              )}
              {currentStatus !== 'blocked' && (
                <Button variant="soft" size="sm" onClick={() => handleStatus(card.id, 'blocked')}>
                  {t('blocked', lang)}
                </Button>
              )}
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        {confirmDelete && card ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-danger-bg p-3">
            <p className="text-sm text-danger font-medium text-center">
              {ar ? 'تأكيد حذف البطاقة نهائياً؟' : 'Permanently delete this card?'}
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">
                {ar ? 'نعم، احذف' : 'Yes, delete'}
              </Button>
              <Button variant="soft" onClick={() => setConfirmDelete(false)}>
                {ar ? 'تراجع' : 'Back'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {ar ? 'حفظ' : 'Save'}
            </Button>
            <Button variant="soft" onClick={cancelEdit}>
              {ar ? 'إلغاء' : 'Cancel'}
            </Button>
            {card && (
              <Button variant="danger" onClick={() => setConfirmDelete(true)} className="px-4">
                {ar ? 'حذف' : 'Delete'}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <span className="absolute top-1/2 -translate-y-1/2 start-4 text-text-muted">
          <Search size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchCards', lang)}
          aria-label={t('searchCards', lang)}
          className="w-full min-h-12 ps-11 pe-4 rounded-full border border-border bg-surface text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>

      {editingId === null && (
        <Button onClick={startNew} className="self-start">
          {ar ? '+ بطاقة جديدة' : '+ New Card'}
        </Button>
      )}

      {editingId === 'new' && <Card>{renderForm(null)}</Card>}

      {filtered.length === 0 && editingId !== 'new' ? (
        <Card className="text-center py-10 text-text-muted">
          <Nfc size={36} strokeWidth={1.5} className="mx-auto mb-2 opacity-60" aria-hidden />
          {cards.length === 0 ? t('noCards', lang) : (ar ? 'لا توجد نتائج' : 'No results found')}
        </Card>
      ) : filtered.length > 0 && (
        <Card className="py-1 animate-fade-up">
          <div className="divide-y divide-border/60">
            {filtered.map(card => (
              editingId === card.id ? (
                <div key={card.id}>{renderForm(card)}</div>
              ) : (
                <ListRow
                  key={card.id}
                  thumb={<Nfc size={22} strokeWidth={1.75} aria-hidden />}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span dir="ltr" className="font-mono text-[15px]">{card.card_uid}</span>
                      {card.label && <span className="text-sm text-text-muted font-normal">· {card.label}</span>}
                    </span>
                  }
                  subtitle={
                    card.customer ? (
                      <span className="flex items-center gap-2">
                        <span>{card.customer.full_name}</span>
                        {card.customer.phone && (
                          <span dir="ltr" className="font-mono text-xs">{card.customer.phone}</span>
                        )}
                      </span>
                    ) : (
                      <span className="opacity-70">{t('unassigned', lang)}</span>
                    )
                  }
                  trailing={
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[effectiveStatus(card)]}>
                        {statusLabel(effectiveStatus(card))}
                      </Badge>
                      <button
                        onClick={() => startEdit(card)}
                        aria-label={ar ? 'تعديل' : 'Edit'}
                        title={ar ? 'تعديل' : 'Edit'}
                        className="w-11 h-11 shrink-0 rounded-full bg-muted hover:bg-border text-brand flex items-center justify-center transition-colors"
                      >
                        <Pencil size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  }
                />
              )
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
