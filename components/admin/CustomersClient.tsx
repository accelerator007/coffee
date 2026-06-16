'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { searchCustomers, updateCustomer, deleteCustomer } from '@/app/admin/customers/actions'
import { Lang, t } from '@/lib/i18n'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ListRow from '@/components/ui/ListRow'

type CustomerRow = Awaited<ReturnType<typeof searchCustomers>>[number]

export default function CustomersClient({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const ar = lang === 'ar'

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const result = await searchCustomers(q)
    setData(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  function startEdit(row: CustomerRow) {
    setEditingId(row.id)
    setForm({ full_name: row.full_name ?? '', phone: row.phone ?? '' })
    setConfirmDelete(false)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setConfirmDelete(false)
    setError('')
  }

  async function handleSave() {
    if (!editingId) return
    setError('')
    setSaving(true)
    const result = await updateCustomer(editingId, form)
    setSaving(false)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    cancelEdit()
    search(query)
  }

  async function handleDelete() {
    if (!editingId) return
    setError('')
    setDeleting(true)
    const result = await deleteCustomer(editingId)
    setDeleting(false)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    cancelEdit()
    search(query)
  }

  const inputClass = `w-full min-h-11 px-4 rounded-2xl border border-border bg-background text-foreground
    placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand`

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-text-muted hover:text-brand text-sm">
          ← {t('dashboard', lang)}
        </Link>
        <h1 className="text-2xl font-black text-brand">{t('customers', lang)}</h1>
      </div>

      <div className="relative">
        <span className="absolute top-1/2 -translate-y-1/2 start-4 text-text-muted">
          <Search size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchCustomers', lang)}
          aria-label={t('searchCustomers', lang)}
          className="w-full min-h-12 ps-11 pe-4 rounded-full border border-border bg-surface text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          autoFocus
        />
        {loading && (
          <span className="absolute top-1/2 -translate-y-1/2 end-4 inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {!loading && data.length === 0 ? (
        <Card className="text-center text-text-muted py-10">
          <Search size={36} strokeWidth={1.5} className="mx-auto mb-2 opacity-60" aria-hidden />
          {ar ? 'لا توجد نتائج' : 'No results found'}
        </Card>
      ) : (
        <Card className="py-1 animate-fade-up">
          <div className="divide-y divide-border/60">
            {data.map(row => (
              editingId === row.id ? (
                /* Inline edit panel */
                <div key={row.id} className="py-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">{ar ? 'الاسم' : 'Name'}</label>
                    <input
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">{ar ? 'رقم الهاتف' : 'Phone'}</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      dir="ltr"
                      placeholder="+9689XXXXXXX"
                      className={inputClass}
                    />
                  </div>

                  {error && <p role="alert" className="text-sm text-danger">{error}</p>}

                  {confirmDelete ? (
                    <div className="flex flex-col gap-2 rounded-2xl bg-danger-bg p-3">
                      <p className="text-sm text-danger font-medium text-center">
                        {ar ? 'تأكيد حذف العميل نهائياً؟' : 'Permanently delete this customer?'}
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
                      <Button variant="danger" onClick={() => setConfirmDelete(true)} className="px-4">
                        {ar ? 'حذف' : 'Delete'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <ListRow
                  key={row.id}
                  thumb={(row.full_name?.trim()?.[0] ?? '?').toUpperCase()}
                  title={row.full_name || '—'}
                  subtitle={
                    <span className="flex items-center gap-2">
                      <span dir="ltr" className="font-mono text-xs">{row.phone ?? '—'}</span>
                      {row.package_name
                        ? <span>· {row.package_name}</span>
                        : <span className="opacity-70">· {ar ? 'بدون اشتراك' : 'No subscription'}</span>
                      }
                    </span>
                  }
                  trailing={
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1 me-1">
                        {row.status
                          ? <Badge status={row.status} label={t(row.status, lang)} />
                          : <span className="text-text-muted text-xs">—</span>
                        }
                        {row.days_left != null && (
                          <span className="text-xs text-text-muted">
                            {Math.max(0, row.days_left)} {ar ? 'يوم' : 'days'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => startEdit(row)}
                        aria-label={ar ? 'تعديل' : 'Edit'}
                        title={ar ? 'تعديل' : 'Edit'}
                        className="w-11 h-11 shrink-0 rounded-full bg-muted hover:bg-border text-brand flex items-center justify-center transition-colors"
                      >
                        <Pencil size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        onClick={() => { startEdit(row); setConfirmDelete(true) }}
                        aria-label={ar ? 'حذف' : 'Delete'}
                        title={ar ? 'حذف' : 'Delete'}
                        className="w-11 h-11 shrink-0 rounded-full bg-danger-bg hover:opacity-80 text-danger flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  }
                />
              )
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
