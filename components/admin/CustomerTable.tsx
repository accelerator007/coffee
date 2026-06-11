import Badge from '@/components/ui/Badge'
import { Lang, t } from '@/lib/i18n'

interface CustomerRow {
  customer_id: string
  full_name: string
  phone: string
  package_name: string
  status: 'active' | 'expired'
  days_left: number
  times_used: number
}

export default function CustomerTable({ data, lang }: { data: CustomerRow[]; lang: Lang }) {
  if (data.length === 0) {
    return (
      <p className="text-center text-text-muted py-8">
        {lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('name', lang)}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('phone', lang)}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('packageName', lang)}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('daysLeft', lang)}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('timesUsed', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.customer_id} className="border-b border-border/50 hover:bg-muted/50">
              <td className="py-3 px-3 font-medium">{row.full_name}</td>
              <td className="py-3 px-3 font-mono text-xs" dir="ltr">{row.phone ?? '—'}</td>
              <td className="py-3 px-3">{row.package_name ?? '—'}</td>
              <td className="py-3 px-3">
                <Badge status={row.status} label={t(row.status, lang)} />
              </td>
              <td className="py-3 px-3">{Math.max(0, row.days_left)}</td>
              <td className="py-3 px-3 font-semibold text-brand">{row.times_used}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
