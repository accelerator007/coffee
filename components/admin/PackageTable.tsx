import { Lang, t } from '@/lib/i18n'
import TierBadge from '@/components/ui/TierBadge'

interface PackageRow {
  package_id: string
  package_name: string
  tier?: string | null
  subscribers_count: number
  redemptions_count: number
}

export default function PackageTable({ data, lang }: { data: PackageRow[]; lang: Lang }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-start py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">{t('packageName', lang)}</th>
            <th className="text-start py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">{t('subscribers', lang)}</th>
            <th className="text-start py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">{t('redemptions', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.package_id} className="border-t border-border hover:bg-muted/50">
              <td className="py-3 px-3">
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-foreground">{row.package_name}</span>
                  <TierBadge tier={row.tier} lang={lang} />
                </span>
              </td>
              <td className="py-3 px-3 text-foreground font-bold tabular-nums">{row.subscribers_count}</td>
              <td className="py-3 px-3 text-foreground tabular-nums">{row.redemptions_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
