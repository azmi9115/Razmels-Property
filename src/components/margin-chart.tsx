"use client"

import { useEffect, useRef } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatPercent, formatRupiah } from "@/lib/format"

export type MarginPoint = {
  month: string
  Pemasukan: number
  Pengeluaran: number
  marginNominal: number
  marginPercentage: number
  healthStatus: string
}

function MarginTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: MarginPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="min-w-52 rounded-xl border bg-popover px-3.5 py-3 text-xs shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{d.healthStatus}</span>
      </div>
      <Row label="Pemasukan" value={formatRupiah(d.Pemasukan)} />
      <Row label="Pengeluaran" value={formatRupiah(d.Pengeluaran)} />
      <div className="mt-2 border-t pt-2">
        <Row label="Margin" value={`${formatPercent(d.marginPercentage, 1)} · ${formatRupiah(d.marginNominal)}`} strong />
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{value}</span>
    </div>
  )
}

// Satu sumbu saja: margin % per bulan. Untung = hijau, rugi = merah.
// (Nominal pemasukan/pengeluaran ada di grafik arus kas terpisah — bukan dual-axis.)
export function MarginChart({ data }: { data: MarginPoint[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [data.length])
  if (data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Belum ada data transaksi</div>
  }

  const minWidth = data.length * 44

  return (
    <div ref={scrollRef} className="thin-scrollbar h-full w-full overflow-x-auto overflow-y-hidden">
      <div className="h-full" style={{ minWidth }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              dy={8}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={48}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              domain={[(min: number) => Math.min(0, Math.floor(min / 10) * 10), (max: number) => Math.max(0, Math.ceil(max / 10) * 10)]}
            />
            <ReferenceLine y={0} stroke="var(--chart-axis)" strokeOpacity={0.5} />
            <Tooltip content={<MarginTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            <Bar dataKey="marginPercentage" radius={[4, 4, 4, 4]} maxBarSize={22}>
              {data.map((d) => (
                <Cell key={d.month} fill={d.marginPercentage >= 0 ? "var(--chart-1)" : "var(--danger)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
