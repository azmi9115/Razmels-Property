import { formatPercent, formatRupiah } from "@/lib/format"

export type BreakdownItem = { name: string; value: number }

// Daftar kategori dengan batang proporsi — pengganti pie chart (lebih mudah dibandingkan).
// Satu seri = satu warna; kategori ke-7 dst digabung jadi "Lainnya".
export function BreakdownList({
  items,
  color = "var(--chart-1)",
  max = 6,
  emptyText = "Belum ada data",
}: {
  items: BreakdownItem[]
  color?: string
  max?: number
  emptyText?: string
}) {
  const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value)
  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
  }

  const head = sorted.slice(0, max)
  const tail = sorted.slice(max)
  const rows = tail.length > 0 ? [...head, { name: `Lainnya (${tail.length})`, value: tail.reduce((a, i) => a + i.value, 0) }] : head
  const total = sorted.reduce((a, i) => a + i.value, 0)
  const top = rows[0].value

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => {
        const share = total > 0 ? (row.value / total) * 100 : 0
        return (
          <li key={row.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate font-medium" title={row.name}>{row.name}</span>
              <span className="shrink-0 font-semibold tabular-nums">{formatRupiah(row.value)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, (row.value / top) * 100)}%`, background: color }} />
              </div>
              <span className="w-11 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{formatPercent(share, share < 10 ? 1 : 0)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
