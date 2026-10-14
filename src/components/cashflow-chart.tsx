"use client"

import { useEffect, useRef } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatRupiah, formatRupiahCompact } from "@/lib/format"

export type CashflowPoint = {
  month: string
  Pemasukan: number
  Pengeluaran: number
}

// Warna dari token --chart-1 / --chart-2 (sudah divalidasi aman buat buta warna)
const SERIES = [
  { key: "Pemasukan", color: "var(--chart-1)" },
  { key: "Pengeluaran", color: "var(--chart-2)" },
] as const

type TooltipPayload = { payload: CashflowPoint }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const net = row.Pemasukan - row.Pengeluaran
  return (
    <div className="min-w-48 rounded-xl border bg-popover px-3.5 py-3 text-xs shadow-xl">
      <p className="mb-2 text-[13px] font-semibold text-foreground">{label}</p>
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.key}
          </span>
          <span className="font-semibold text-foreground tabular-nums">{formatRupiah(row[s.key])}</span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between gap-6 border-t pt-2">
        <span className="text-muted-foreground">Selisih</span>
        <span className={`font-semibold tabular-nums ${net >= 0 ? "text-success" : "text-danger"}`}>{formatRupiah(net)}</span>
      </div>
    </div>
  )
}

export function CashflowLegend({ data }: { data: CashflowPoint[] }) {
  const totals = {
    Pemasukan: data.reduce((a, d) => a + d.Pemasukan, 0),
    Pengeluaran: data.reduce((a, d) => a + d.Pengeluaran, 0),
  }
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          <span className="text-[13px] text-muted-foreground">{s.key}</span>
          <span className="text-[13px] font-semibold tabular-nums">{formatRupiahCompact(totals[s.key])}</span>
        </div>
      ))}
    </div>
  )
}

export function CashflowChart({ data, minPointWidth = 0 }: { data: CashflowPoint[]; minPointWidth?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [data.length])
  if (data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Belum ada data transaksi</div>
  }

  // Riwayat panjang bisa digeser horizontal supaya batang tidak gepeng
  const minWidth = minPointWidth > 0 ? data.length * minPointWidth : 0

  return (
    <div ref={scrollRef} className="thin-scrollbar h-full w-full overflow-x-auto overflow-y-hidden">
      <div className="h-full" style={{ minWidth: minWidth || undefined }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={2} barCategoryGap="28%">
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
              width={72}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              tickFormatter={(value) => formatRupiahCompact(Number(value))}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
