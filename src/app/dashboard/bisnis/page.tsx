import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Briefcase, FileText, Building2, CalendarRange, EyeOff, Gauge, HandCoins, Landmark, ListChecks, Table2, TrendingUp } from "lucide-react"
import prisma from "@/lib/prisma"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CashflowChart, CashflowLegend } from "@/components/cashflow-chart"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { buildEntries, classifyCashflow, SEGMENT_INFO, SEGMENTS, unmatchedRentPayments, type BizEntry, type Segment } from "@/lib/business"
import { formatDate, formatMonthShort, formatPercent, formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Totals = { revenue: number; opex: number }
type Bucket = Totals & { segments: Record<Segment, Totals> }

const emptyBucket = (): Bucket => ({
  revenue: 0,
  opex: 0,
  segments: Object.fromEntries(SEGMENTS.map((s) => [s, { revenue: 0, opex: 0 }])) as Record<Segment, Totals>,
})
const marginOf = (t: Totals) => (t.revenue > 0 ? ((t.revenue - t.opex) / t.revenue) * 100 : 0)

function addEntry(b: Bucket, e: BizEntry) {
  b[e.kind === "revenue" ? "revenue" : "opex"] += e.amount
  b.segments[e.segment][e.kind === "revenue" ? "revenue" : "opex"] += e.amount
}

// Kelompokkan entri per kunci (tahun / bulan), urut terbaru dulu
function groupBy(entries: BizEntry[], keyOf: (d: Date) => string) {
  const map = new Map<string, Bucket>()
  for (const e of entries) {
    const key = keyOf(e.date)
    if (!map.has(key)) map.set(key, emptyBucket())
    addEntry(map.get(key)!, e)
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
}

export default async function BisnisPage(props: { searchParams?: Promise<{ year?: string }> }) {
  const searchParams = await props.searchParams
  const [cashflows, payments] = await Promise.all([
    prisma.cashflow.findMany({ orderBy: { transaction_date: "desc" } }),
    prisma.payment.findMany({ include: { tenant: { include: { building: true } } }, orderBy: { transfer_date: "desc" } }),
  ])

  const entries = buildEntries(payments, cashflows)
  const yearly = groupBy(entries, (d) => String(d.getFullYear()))
  const years = yearly.map(([y]) => Number(y))

  const selected = searchParams?.year === "all" ? "all" : Number(searchParams?.year) || years[0] || new Date().getFullYear()
  const inPeriod = (d: Date) => selected === "all" || new Date(d).getFullYear() === selected
  const periodLabel = selected === "all" ? "semua tahun" : `tahun ${selected}`

  const periodEntries = entries.filter((e) => inPeriod(e.date))
  const total = emptyBucket()
  periodEntries.forEach((e) => addEntry(total, e))
  const monthly = groupBy(periodEntries, (d) => `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`).map(([key, b]) => {
    const [y, m] = key.split("-").map(Number)
    return { label: formatMonthShort(y, m), ...b }
  })
  const chartData = monthly.map((m) => ({ month: m.label, Pemasukan: m.revenue, Pengeluaran: m.opex }))
  const profit = total.revenue - total.opex

  const periodCashflows = cashflows.filter((c) => inPeriod(c.transaction_date)).map((c) => ({ ...c, cls: classifyCashflow(c) }))
  const personal = { in: 0, out: 0 }
  for (const c of periodCashflows) {
    if (c.cls.kind !== "personal") continue
    if (c.type === "Pemasukan") personal.in += c.amount
    else personal.out += c.amount
  }
  const excludedRows = periodCashflows.filter((c) => c.cls.kind === "excluded")
  const unmatched = unmatchedRentPayments(payments, cashflows).filter((p) => inPeriod(p.transfer_date))
  const unmatchedTotal = unmatched.reduce((a, p) => a + p.amount, 0)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Keuangan"
        title="Laporan Bisnis"
        description="Pendapatan sewa dan biaya operasional properti saja — terpisah dari pemasukan & pengeluaran pribadi di buku besar."
        actions={
          <>
          <Link href={`/dashboard/bisnis/tahunan?year=${selected === "all" ? (years[0] ?? "") : selected}`} className={buttonVariants({ size: "lg" })}>
            <FileText className="size-4" /> Laporan Tahunan
          </Link>
          <nav aria-label="Pilih periode" className="no-scrollbar inline-flex h-9 max-w-full items-center overflow-x-auto rounded-lg bg-muted p-1">
            {[...years.map(String), "all"].map((y) => (
              <Link
                key={y}
                href={`/dashboard/bisnis?year=${y}`}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                  String(selected) === y ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {y === "all" ? "Semua" : y}
              </Link>
            ))}
          </nav>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendapatan sewa" icon={ArrowUpRight} tone="success" value={formatRupiah(total.revenue)} hint={`Kos, kios & 2 apartemen · ${periodLabel}`} />
        <StatCard label="Biaya operasional" icon={ArrowDownRight} tone="danger" value={formatRupiah(total.opex)} hint="Listrik, IPL, perawatan, gaji, komisi" />
        <StatCard label="Laba operasional" icon={Landmark} tone={profit >= 0 ? "info" : "danger"} value={formatRupiah(profit)} hint="Pendapatan − biaya operasional" />
        <StatCard label="Margin" icon={Gauge} tone={marginOf(total) >= 30 ? "success" : marginOf(total) >= 0 ? "warning" : "danger"} value={formatPercent(marginOf(total), 1)} hint="Laba ÷ pendapatan" />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="min-w-0 xl:col-span-3" title="Pendapatan vs biaya per bulan" description="Terbaru di kiri — geser ke samping untuk bulan lama" icon={TrendingUp} actions={<CashflowLegend data={chartData} />}>
          <div className="h-[300px]">
            <CashflowChart data={chartData} minPointWidth={56} />
          </div>
        </Panel>

        <Panel className="min-w-0 xl:col-span-2" title="Per unit usaha" description={`Kontribusi tiap aset · ${periodLabel}`} icon={Building2}>
          <ul className="space-y-3">
            {SEGMENTS.map((s) => {
              const t = total.segments[s]
              const share = total.revenue > 0 ? (t.revenue / total.revenue) * 100 : 0
              return (
                <li key={s} className="rounded-xl border p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{s}</p>
                      <p className="truncate text-xs text-muted-foreground">{SEGMENT_INFO[s]}</p>
                    </div>
                    <p className={cn("shrink-0 font-semibold tabular-nums", t.revenue - t.opex < 0 && "text-danger")}>{formatRupiah(t.revenue - t.opex)}</p>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success" style={{ width: `${share}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <span>Masuk {formatRupiah(t.revenue)} ({formatPercent(share)})</span>
                    <span>Biaya {formatRupiah(t.opex)}</span>
                    <span>Margin {formatPercent(marginOf(t), 1)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-foreground"><EyeOff className="size-3.5" /> Tidak dihitung (pribadi & investasi)</p>
            <p className="mt-1 tabular-nums">Masuk {formatRupiah(personal.in)} · Keluar {formatRupiah(personal.out)}</p>
            <p className="mt-1">Mesjid 52, Sedekah, Zakat, Wakaf, Bank (kupon SBR/ORI), Lain-lain.</p>
          </div>
        </Panel>
      </div>

      <Panel title="Ringkasan per tahun" description="Laba tiap aset per tahun (pendapatan − biaya). Klik tahun untuk rinciannya." icon={Table2} bodyClassName="p-0 pt-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Tahun</TableHead>
              {SEGMENTS.map((s) => <TableHead key={s} className="text-right">{s}</TableHead>)}
              <TableHead className="text-right">Pendapatan</TableHead>
              <TableHead className="text-right">Biaya</TableHead>
              <TableHead className="text-right">Laba</TableHead>
              <TableHead className="pr-5 text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yearly.map(([year, b]) => (
              <TableRow key={year} className={cn(String(selected) === year && "bg-accent/40")}>
                <TableCell className="pl-5 font-semibold">
                  <Link href={`/dashboard/bisnis?year=${year}`} className="hover:underline">{year}</Link>
                </TableCell>
                {SEGMENTS.map((s) => <SegmentCell key={s} t={b.segments[s]} mode="profit" />)}
                <TableCell className="text-right tabular-nums text-success">{formatRupiah(b.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums text-danger">{formatRupiah(b.opex)}</TableCell>
                <TableCell className={cn("text-right font-semibold tabular-nums", b.revenue - b.opex < 0 && "text-danger")}>{formatRupiah(b.revenue - b.opex)}</TableCell>
                <TableCell className="pr-5 text-right tabular-nums text-muted-foreground">{formatPercent(marginOf(b), 1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel title="Rincian per bulan" description={`Pendapatan tiap aset & porsinya dari total bulan itu · terbaru di atas · ${periodLabel}`} icon={CalendarRange} bodyClassName="p-0 pt-4">
        {monthly.length === 0 ? (
          <EmptyState icon={Briefcase} title="Belum ada transaksi usaha" description="Tidak ada pendapatan atau biaya operasional di periode ini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Bulan</TableHead>
                {SEGMENTS.map((s) => <TableHead key={s} className="text-right">{s}</TableHead>)}
                <TableHead className="text-right">Pendapatan</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
                <TableHead className="text-right">Laba</TableHead>
                <TableHead className="pr-5 text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthly.map((m) => (
                <TableRow key={m.label}>
                  <TableCell className="pl-5 font-medium">{m.label}</TableCell>
                  {SEGMENTS.map((s) => <SegmentCell key={s} t={m.segments[s]} mode="share" totalRevenue={m.revenue} />)}
                  <TableCell className="text-right tabular-nums text-success">{formatRupiah(m.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums text-danger">{formatRupiah(m.opex)}</TableCell>
                  <TableCell className={cn("text-right font-semibold tabular-nums", m.revenue - m.opex < 0 && "text-danger")}>{formatRupiah(m.revenue - m.opex)}</TableCell>
                  <TableCell className="pr-5 text-right tabular-nums text-muted-foreground">{formatPercent(marginOf(m), 1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Panel
        title="Sewa belum ketemu di rekening"
        description={`Tercatat di Pembayaran, tapi tidak ada uang masuk yang cocok di Cash Flow · ${unmatched.length} transaksi, ${formatRupiah(unmatchedTotal)}`}
        icon={HandCoins}
        bodyClassName="p-0 pt-4"
      >
        {unmatched.length === 0 ? (
          <EmptyState icon={HandCoins} title="Semua cocok" description={`Semua sewa ${periodLabel} sudah ketemu di rekening.`} />
        ) : (
          <>
            <p className="px-5 pb-3 text-[13px] text-muted-foreground">
              Biasanya dibayar tunai / lewat pengelola, atau ditransfer gabungan beberapa bulan sekaligus. Tetap dihitung sebagai pendapatan.
            </p>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Tanggal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Penghuni</TableHead>
                  <TableHead className="pr-5 text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatched.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-5 text-[13px] text-muted-foreground tabular-nums">{formatDate(p.transfer_date)}</TableCell>
                    <TableCell className="font-mono text-xs">{p.tenant.building?.code ?? "—"}</TableCell>
                    <TableCell className="font-medium">{p.tenant.name}</TableCell>
                    <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatRupiah(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Panel>

      <Panel
        title="Dikecualikan dari laporan"
        description="Ada di kategori usaha, tapi bukan pendapatan/biaya operasional. Cek apakah sudah benar."
        icon={ListChecks}
        bodyClassName="p-0 pt-4"
      >
        {excludedRows.length === 0 ? (
          <EmptyState icon={ListChecks} title="Tidak ada" description={`Tidak ada transaksi yang dikecualikan di ${periodLabel}.`} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead className="pr-5 text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {excludedRows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-5 text-[13px] text-muted-foreground tabular-nums">{formatDate(c.transaction_date)}</TableCell>
                  <TableCell className="font-medium">{c.category}</TableCell>
                  <TableCell className="max-w-xs truncate text-[13px] text-muted-foreground" title={c.description}>{c.description}</TableCell>
                  <TableCell className="text-[13px]">{c.cls.kind === "excluded" ? c.cls.reason : ""}</TableCell>
                  <TableCell className={cn("pr-5 text-right font-semibold tabular-nums", c.type === "Pemasukan" ? "text-success" : "text-danger")}>
                    {c.type === "Pemasukan" ? "+" : "−"} {formatRupiah(c.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}

// Sel per aset: "profit" = laba (+ masuk/biaya kecil), "share" = pendapatan + porsi % (+ biaya kecil)
function SegmentCell({ t, mode, totalRevenue = 0 }: { t: Totals; mode: "profit" | "share"; totalRevenue?: number }) {
  if (t.revenue === 0 && t.opex === 0) {
    return <TableCell className="text-right text-muted-foreground/50">—</TableCell>
  }
  const profit = t.revenue - t.opex
  return (
    <TableCell className="text-right tabular-nums">
      {mode === "profit" ? (
        <>
          <p className={cn("font-medium", profit < 0 && "text-danger")}>{formatRupiah(profit)}</p>
          <p className="text-[11px] text-muted-foreground">+{formatRupiah(t.revenue)} · −{formatRupiah(t.opex)}</p>
        </>
      ) : (
        <>
          <p className="font-medium">
            {formatRupiah(t.revenue)}
            {t.revenue > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{formatPercent(totalRevenue > 0 ? (t.revenue / totalRevenue) * 100 : 0)}</span>}
          </p>
          {t.opex > 0 && <p className="text-[11px] text-danger">biaya {formatRupiah(t.opex)}</p>}
        </>
      )}
    </TableCell>
  )
}
