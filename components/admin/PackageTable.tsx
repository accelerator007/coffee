import { Lang, t } from '@/lib/i18n'

interface PackageRow {
  package_id: string
  package_name: string
  subscribers_count: number
  redemptions_count: number
}

export default function PackageTable({ data, lang }: { data: PackageRow[]; lang: Lang }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('packageName', lang)}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('subscribers', lang)}</th>
            <th className="text-start py-2 px-3 font-medium text-text-muted">{t('redemptions', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.package_id} className="border-b border-border/50 hover:bg-muted/50">
              <td className="py-3 px-3 font-medium">{row.package_name}</td>
              <td className="py-3 px-3 text-brand font-semibold">{row.subscribers_count}</td>
              <td className="py-3 px-3">{row.redemptions_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
