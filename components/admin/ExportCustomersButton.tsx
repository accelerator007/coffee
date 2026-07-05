'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import { exportCustomersReport } from '@/app/admin/actions'

// Quote a CSV field when it contains a delimiter, quote, or newline.
function csvField(value: string | number | null): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Downloads the customer report as a CSV that opens directly in Excel:
 * UTF-8 BOM keeps Arabic intact, and the `sep=,` hint keeps columns split
 * correctly regardless of the machine's regional list separator.
 */
export default function ExportCustomersButton({ lang }: { lang: Lang }) {
  const [loading, setLoading] = useState(false)
  const ar = lang === 'ar'

  async function handleExport() {
    setLoading(true)
    try {
      const rows = await exportCustomersReport()

      const headers = ar
        ? ['الاسم', 'الهاتف', 'الباقة', 'الفئة', 'تاريخ بداية الاشتراك', 'الأيام المتبقية', 'الحالة', 'الأكواب المستخدمة', 'إجمالي الأكواب', 'نسبة الاستهلاك %']
        : ['Name', 'Phone', 'Package', 'Tier', 'Start Date', 'Days Left', 'Status', 'Used Cups', 'Total Cups', 'Consumption %']

      const tierLabel = (tier: string | null) => {
        if (tier === 'gold') return ar ? 'ذهبية' : 'Gold'
        if (tier === 'silver') return ar ? 'فضية' : 'Silver'
        if (tier === 'bronze') return ar ? 'برونزية' : 'Bronze'
        return ''
      }
      const statusLabel = (status: string | null) => {
        if (status === 'active') return ar ? 'نشط' : 'Active'
        if (status === 'expired') return ar ? 'منتهي' : 'Expired'
        return ar ? 'بدون اشتراك' : 'No subscription'
      }

      const lines = rows.map(r => [
        csvField(r.full_name),
        csvField(r.phone),
        csvField(r.package_name ?? (ar ? 'بدون باقة' : 'No package')),
        csvField(tierLabel(r.tier)),
        csvField(r.start_date),
        csvField(r.days_left),
        csvField(statusLabel(r.status)),
        csvField(r.used_cups),
        csvField(r.total_cups),
        csvField(r.consumption_pct),
      ].join(','))

      const csv = '\uFEFF' + 'sep=,\n' + headers.map(csvField).join(',') + '\n' + lines.join('\n')

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `district7-customers-${today}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-sm font-bold px-4 py-1.5 rounded-full transition-colors text-foreground bg-muted hover:bg-border inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      {loading
        ? <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : <Download size={15} strokeWidth={2} aria-hidden />}
      {t('exportExcel', lang)}
    </button>
  )
}
