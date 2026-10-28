import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import prisma from "@/lib/prisma"
import { buttonVariants } from "@/components/ui/button"
import { PrintButton } from "@/components/print-button"
import { BrandMark } from "@/components/brand"
import {
  arrearsAsOf,
  buildEntries,
  occupancyForYear,
  SEGMENT_INFO,
  SEGMENTS,
  unmatchedRentPayments,
  type BizEntry,
  type Segment,
} from "@/lib/business"
import { formatDate, formatDateLong, formatMonthShort, formatPercent, formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

// PPh final sewa tanah/bangunan (PPh 4 ayat 2) = 10% dari pendapatan bruto — hanya estimasi
const TAX_RATE = 0.1

type Sum = { revenue: number; routine: number; capex: number }
const emptySum = (): Sum => ({ revenue: 0, routine: 0, capex: 0 })
const costOf = (s: Sum) => s.routine + s.capex
const profitOf = (s: Sum) => s.revenue - costOf(s)
const marginOf = (s: Sum) => (s.revenue > 0 ? (profitOf(s) / s.revenue) * 100 : 0)

function summarize(entries: BizEntry[]) {
  const total = emptySum()
  const bySegment = Object.fromEntries(SEGMENTS.map((s) => [s, emptySum()])) as Record<Segment, Sum>
  for (const e of entries) {
    for (const s of [total, bySegment[e.segment]]) {
      if (e.kind === "revenue") s.revenue += e.amount
      else if (e.capex) s.capex += e.amount
      else s.routine += e.amount
    }
  }
  return { total, bySegment }
}

export default async function LaporanTahunanPage(props: { searchParams?: Promise<{ year?: string }> }) {
  const searchParams = await props.searchParams
  const [cashflows, payments, buildings, tenants] = await Promise.all([
    prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } }),
    prisma.payment.findMany({ include: { tenant: { include: { building: true } } } }),
    prisma.building.findMany({ orderBy: { code: "asc" } }),
    prisma.tenant.findMany({ include: { building: true, payments: true } }),
  ])

  const entries = buildEntries(payments, cashflows)
  const years = Array.from(new Set(entries.filter((e) => e.kind === "revenue").map((e) => e.date.getFullYear()))).sort((a, b) => b - a)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = Number(searchParams?.year) || years[0] || today.getFullYear()
  const isRunning = year === today.getFullYear()

  // Periode: setahun penuh, atau 1 Jan s.d. hari ini kalau tahun berjalan.
  // Pembanding = periode yang sama tahun lalu.
  const start = new Date(year, 0, 1)
  const end = isRunning ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)
  const prevStart = new Date(year - 1, 0, 1)
  const prevEnd = new Date(end)
  prevEnd.setFullYear(year - 1)

  const current = entries.filter((e) => e.date >= start && e.date <= end)
  const previous = entries.filter((e) => e.date >= prevStart && e.date <= prevEnd)
  const { total, bySegment } = summarize(current)
  const prev = summarize(previous)
  const hasPrev = previous.length > 0

  const tax = total.revenue * TAX_RATE
  const operatingProfit = total.revenue - total.routine

  // Komposisi biaya per jenis
  const costTypes = new Map<string, { amount: number; capex: boolean }>()
  for (const e of current) {
    if (e.kind !== "opex") continue
    const key = e.costType ?? "Lain-lain"
    const c = costTypes.get(key) ?? { amount: 0, capex: !!e.capex }
    c.amount += e.amount
    costTypes.set(key, c)
  }
  const costRows = Array.from(costTypes.entries()).sort((a, b) => b[1].amount - a[1].amount)
  const totalCost = costOf(total)

  // Bulanan (terbaru di atas)
  const lastMonth = end.getMonth()
  const monthly = Array.from({ length: lastMonth + 1 }, (_, m) => {
    const s = summarize(current.filter((e) => e.date.getMonth() === m))
    return { label: formatMonthShort(year, m), ...s }
  }).reverse()

  const occupancy = occupancyForYear(buildings, tenants, year, lastMonth)
  const arrears = arrearsAsOf(tenants, end)
  const cashRent = unmatchedRentPayments(payments, cashflows).filter((p) => p.transfer_date >= start && p.transfer_date <= end)

  const periodText = isRunning
    ? `1 Januari – ${formatDateLong(today)} (tahun berjalan)`
    : `1 Januari – 31 Desember ${year}`
  const compareText = isRunning ? "periode sama tahun lalu" : `tahun ${year - 1}`

  return (
    <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/dashboard/bisnis?year=${year}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <ArrowLeft className="size-4" /> Laporan Bisnis
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Pilih tahun" className="no-scrollbar inline-flex h-9 max-w-full items-center overflow-x-auto rounded-lg bg-muted p-1">
            {years.map((y) => (
              <Link
                key={y}
                href={`/dashboard/bisnis/tahunan?year=${y}`}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                  y === year ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {y}
              </Link>
            ))}
          </nav>
          <PrintButton label="Cetak / PDF" />
        </div>
      </div>

      {/* Kertas laporan — selalu terang, juga saat dark mode */}
      <article className="print-report overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0">
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-indigo-500" />
        <div className="space-y-10 p-6 sm:p-10 print:space-y-7 print:px-0 print:pb-0">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <BrandMark className="size-11" />
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">Razmel&apos;s Property</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Laporan Tahunan {year}</h1>
              </div>
            </div>
            <div className="text-sm text-slate-500 sm:text-right">
              <p>Periode {periodText}</p>
              <p>Dibuat {formatDateLong(today)}</p>
            </div>
          </header>

          {/* 1. Ringkasan */}
          <Section no={1} title="Ringkasan" subtitle={`Dibanding ${compareText}`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <Metric label="Pendapatan sewa" value={formatRupiah(total.revenue)} now={total.revenue} before={hasPrev ? prev.total.revenue : null} />
              <Metric label="Total biaya" value={formatRupiah(totalCost)} now={totalCost} before={hasPrev ? costOf(prev.total) : null} inverse />
              <Metric label="Laba bersih" value={formatRupiah(profitOf(total))} now={profitOf(total)} before={hasPrev ? profitOf(prev.total) : null} strong />
              <Metric label="Margin" value={formatPercent(marginOf(total), 1)} pointNow={marginOf(total)} pointBefore={hasPrev ? marginOf(prev.total) : null} />
            </div>
            <dl className="mt-4 grid gap-x-8 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <Line label="Biaya rutin (operasional)" value={formatRupiah(total.routine)} />
              <Line label="Investasi renovasi & perabot" value={formatRupiah(total.capex)} />
              <Line label="Laba operasional (sebelum investasi)" value={formatRupiah(operatingProfit)} />
              <Line label={`Estimasi PPh final sewa ${TAX_RATE * 100}%`} value={formatRupiah(tax)} />
              <Line label="Laba bersih setelah estimasi pajak" value={formatRupiah(profitOf(total) - tax)} strong />
              <Line label="Sewa diterima tunai / di luar rekening" value={`${cashRent.length}× · ${formatRupiah(cashRent.reduce((a, p) => a + p.amount, 0))}`} />
            </dl>
          </Section>

          {/* 2. Laba-rugi per aset */}
          <Section no={2} title="Laba-rugi per aset">
            <ReportTable
              head={["Aset", "Pendapatan", "Biaya rutin", "Investasi", "Laba", "Margin", `Laba ${compareText}`]}
              rows={[
                ...SEGMENTS.map((s) => {
                  const t = bySegment[s]
                  const p = prev.bySegment[s]
                  return [
                    <div key="n"><p className="font-semibold">{s}</p><p className="text-xs text-slate-500">{SEGMENT_INFO[s]}</p></div>,
                    formatRupiah(t.revenue),
                    formatRupiah(t.routine),
                    formatRupiah(t.capex),
                    <span key="l" className={cn("font-semibold", profitOf(t) < 0 && "text-red-600")}>{formatRupiah(profitOf(t))}</span>,
                    formatPercent(marginOf(t), 1),
                    hasPrev ? formatRupiah(profitOf(p)) : "—",
                  ]
                }),
                [
                  <span key="n" className="font-bold">Total</span>,
                  <b key="r">{formatRupiah(total.revenue)}</b>,
                  <b key="o">{formatRupiah(total.routine)}</b>,
                  <b key="c">{formatRupiah(total.capex)}</b>,
                  <b key="l" className={cn(profitOf(total) < 0 && "text-red-600")}>{formatRupiah(profitOf(total))}</b>,
                  <b key="m">{formatPercent(marginOf(total), 1)}</b>,
                  hasPrev ? <b key="p">{formatRupiah(profitOf(prev.total))}</b> : "—",
                ],
              ]}
            />
          </Section>

          {/* 3. Komposisi biaya */}
          <Section no={3} title="Komposisi biaya" subtitle={`Total ${formatRupiah(totalCost)}`}>
            {costRows.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada biaya tercatat.</p>
            ) : (
              <ul className="space-y-2.5">
                {costRows.map(([label, c]) => {
                  const pct = totalCost > 0 ? (c.amount / totalCost) * 100 : 0
                  return (
                    <li key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 text-sm sm:grid-cols-[14rem_minmax(0,1fr)_9rem]">
                      <span className="font-medium">
                        {label}
                        {c.capex && <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[0.625rem] font-semibold text-indigo-700">INVESTASI</span>}
                      </span>
                      <span className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-slate-100 sm:order-none sm:col-span-1">
                        <span className={cn("block h-full rounded-full", c.capex ? "bg-indigo-500" : "bg-emerald-600")} style={{ width: `${pct}%` }} />
                      </span>
                      <span className="text-right tabular-nums">{formatRupiah(c.amount)} <span className="text-xs text-slate-500">{formatPercent(pct)}</span></span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>

          {/* 4. Hunian */}
          <Section no={4} title="Tingkat hunian" subtitle="Unit dihitung terisi kalau ada penghuni pada tanggal 15 tiap bulan">
            <ReportTable
              head={["Aset", "Unit", "Unit-bulan terisi", "Hunian", "Potensi sewa hilang (kosong)"]}
              rows={SEGMENTS.map((s) => {
                const o = occupancy[s]
                const rate = o.unitMonths > 0 ? (o.occupied / o.unitMonths) * 100 : 0
                return [
                  <span key="n" className="font-semibold">{s}</span>,
                  String(o.units),
                  o.hasTenantData ? `${o.occupied} / ${o.unitMonths}` : "—",
                  o.hasTenantData ? (
                    <span key="r" className={cn("font-semibold", rate < 50 ? "text-red-600" : rate < 80 ? "text-amber-600" : "text-emerald-700")}>{formatPercent(rate, 1)}</span>
                  ) : (
                    <span key="r" className="text-xs text-slate-500">Data penghuni belum ada</span>
                  ),
                  o.hasTenantData ? formatRupiah(o.lostRent) : "—",
                ]
              })}
            />
          </Section>

          {/* 5. Tunggakan */}
          <Section no={5} keep={false} title={`Tunggakan per ${formatDateLong(end)}`} subtitle={arrears.length > 0 ? `${arrears.length} penghuni · ${formatRupiah(arrears.reduce((a, r) => a + r.amount, 0))}` : undefined}>
            {arrears.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada tunggakan pada tanggal ini.</p>
            ) : (
              <ReportTable
                head={["Unit", "Penghuni", "Sewa habis", "Bulan", "Perkiraan nominal"]}
                rows={arrears.map((r) => [
                  <span key="c" className="font-mono text-xs">{r.code}</span>,
                  r.name,
                  formatDate(r.coveredUntil),
                  String(r.months),
                  <span key="a" className="font-semibold text-red-600">{formatRupiah(r.amount)}</span>,
                ])}
              />
            )}
          </Section>

          {/* 6. Bulanan */}
          <Section no={6} keep={false} title="Rincian per bulan" subtitle="Terbaru di atas">
            <ReportTable
              head={["Bulan", ...SEGMENTS, "Pendapatan", "Biaya", "Laba"]}
              rows={monthly.map((m) => [
                <span key="m" className="font-medium">{m.label}</span>,
                ...SEGMENTS.map((s) => (m.bySegment[s].revenue > 0 ? formatRupiah(m.bySegment[s].revenue) : <span key={s} className="text-slate-300">—</span>)),
                formatRupiah(m.total.revenue),
                formatRupiah(costOf(m.total)),
                <span key="l" className={cn("font-semibold", profitOf(m.total) < 0 && "text-red-600")}>{formatRupiah(profitOf(m.total))}</span>,
              ])}
            />
          </Section>

          {/* 7. Catatan */}
          <Section no={7} title="Catatan & metode">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
              <li>Hanya transaksi usaha properti. Pengeluaran pribadi (Mesjid 52, sedekah, zakat, wakaf) dan hasil investasi bank (kupon SBR/ORI) tidak dihitung.</li>
              <li>Pendapatan kos & kios diambil dari catatan Pembayaran, termasuk sewa yang dibayar tunai. Pendapatan apartemen dan semua biaya diambil dari Cash Flow.</li>
              <li>Berbasis kas: dicatat pada tanggal uang diterima/dikeluarkan. Sewa yang dibayar sekaligus untuk beberapa bulan tercatat di bulan pembayarannya.</li>
              <li>Pengembalian deposit dihitung sebagai biaya, karena deposit yang diterima tercampur di pemasukan sewa.</li>
              <li>&quot;Investasi&quot; = pembelian material, renovasi, dan perabot (keramik, cat, kasur, kipas, pompa, dll.). Tetap masuk total biaya.</li>
              <li>PPh final sewa {TAX_RATE * 100}% hanya estimasi dari pendapatan bruto — pastikan ke konsultan pajak.</li>
              <li>Tunggakan & hunian dihitung dari data penghuni; nominal tunggakan memakai tarif unit saat ini.</li>
            </ul>
          </Section>
        </div>
      </article>
    </div>
  )
}

// keep = jangan dipotong antarhalaman saat dicetak (untuk bagian pendek)
function Section({ no, title, subtitle, keep = true, children }: { no: number; title: string; subtitle?: string; keep?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn(keep && "break-inside-avoid-page")}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">
          <span className="mr-2 text-emerald-600">{no}.</span>
          {title}
        </h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Metric({
  label,
  value,
  now,
  before,
  pointNow,
  pointBefore,
  inverse,
  strong,
}: {
  label: string
  value: string
  now?: number
  before?: number | null
  pointNow?: number
  pointBefore?: number | null
  inverse?: boolean
  strong?: boolean
}) {
  // Perubahan: % untuk nominal, poin persen untuk margin
  let change: { text: string; good: boolean } | null = null
  if (pointNow !== undefined && pointBefore != null) {
    const d = pointNow - pointBefore
    change = { text: `${d >= 0 ? "+" : "−"}${Math.abs(d).toLocaleString("id-ID", { maximumFractionDigits: 1 })} poin`, good: d >= 0 }
  } else if (now !== undefined && before != null && before !== 0) {
    const d = ((now - before) / Math.abs(before)) * 100
    change = { text: `${d >= 0 ? "▲" : "▼"} ${formatPercent(Math.abs(d), 1)}`, good: inverse ? d <= 0 : d >= 0 }
  }
  return (
    <div className={cn("rounded-xl border border-slate-200 p-4", strong && "border-emerald-200 bg-emerald-50/60")}>
      <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-slate-500 uppercase">{label}</p>
      <p className="mt-1.5 text-xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className={cn("mt-1 text-xs font-medium", !change ? "text-slate-400" : change.good ? "text-emerald-700" : "text-red-600")}>
        {change ? change.text : "Tidak ada pembanding"}
      </p>
    </div>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-slate-200 py-1 last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className={cn("whitespace-nowrap tabular-nums", strong ? "font-bold" : "font-medium")}>{value}</dd>
    </div>
  )
}

function ReportTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left text-[0.6875rem] tracking-[0.06em] text-slate-500 uppercase">
            {head.map((h, i) => (
              <th key={h} className={cn("px-2 py-2 font-semibold whitespace-nowrap first:pl-0 last:pr-0", i > 0 && "text-right")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-slate-100 last:border-0">
              {r.map((cell, i) => (
                <td key={i} className={cn("px-2 py-2.5 align-top tabular-nums first:pl-0 last:pr-0 print:py-1.5", i === 0 ? "min-w-[9rem]" : "text-right whitespace-nowrap")}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
