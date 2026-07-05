'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Lang, t } from '@/lib/i18n'
import { exportCustomersReport } from '@/app/admin/actions'

/**
 * Downloads the customer report as a real .xlsx workbook (exceljs, loaded
 * on demand) — native Excel format, so Arabic text, column splitting, and
 * RTL need no encoding tricks.
 */
export default function ExportCustomersButton({ lang }: { lang: Lang }) {
  const [loading, setLoading] = useState(false)
  const ar = lang === 'ar'

  async function handleExport() {
    setLoading(true)
    try {
      const [rows, { Workbook }] = await Promise.all([
        exportCustomersReport(),
        import('exceljs'),
      ])

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

      const workbook = new Workbook()
      const sheet = workbook.addWorksheet(ar ? 'العملاء' : 'Customers', {
        views: [{ rightToLeft: ar }],
      })

      sheet.columns = [
        { header: ar ? 'الاسم' : 'Name', key: 'name', width: 24 },
        { header: ar ? 'الهاتف' : 'Phone', key: 'phone', width: 16 },
        { header: ar ? 'الباقة' : 'Package', key: 'pkg', width: 18 },
        { header: ar ? 'الفئة' : 'Tier', key: 'tier', width: 10 },
        { header: ar ? 'تاريخ بداية الاشتراك' : 'Start Date', key: 'start', width: 18 },
        { header: ar ? 'الأيام المتبقية' : 'Days Left', key: 'days', width: 13 },
        { header: ar ? 'الحالة' : 'Status', key: 'status', width: 13 },
        { header: ar ? 'الأكواب المستخدمة' : 'Used Cups', key: 'used', width: 15 },
        { header: ar ? 'إجمالي الأكواب' : 'Total Cups', key: 'total', width: 13 },
        { header: ar ? 'نسبة الاستهلاك %' : 'Consumption %', key: 'pct', width: 15 },
      ]

      for (const r of rows) {
        sheet.addRow({
          name: r.full_name,
          phone: r.phone ?? '',
          pkg: r.package_name ?? (ar ? 'بدون باقة' : 'No package'),
          tier: tierLabel(r.tier),
          start: r.start_date ?? '',
          days: r.days_left ?? '',
          status: statusLabel(r.status),
          used: r.used_cups ?? '',
          total: r.total_cups ?? '',
          pct: r.consumption_pct ?? '',
        })
      }

      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.alignment = { horizontal: 'center' }

      const buffer = await workbook.xlsx.writeBuffer()
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' })
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `district7-customers-${today}.xlsx`
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
