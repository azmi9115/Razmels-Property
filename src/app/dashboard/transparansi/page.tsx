import Link from "next/link"
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Coins, GraduationCap, Landmark, Search, Sparkles, Table2, Waypoints } from "lucide-react"
import prisma from "@/lib/prisma"
import { getLatestSnapshot } from "@/app/actions/snapshot"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { InsightList } from "@/components/insight-list"
import { ReviewButton } from "@/components/review-button"
import { DeleteRuleButton, GroupPicker } from "@/components/group-picker"
import { AiSuggestions } from "@/components/ai-suggestions"
import { StatusPill, type Tone } from "@/components/status-pill"
import { buildEntries, classifyCashflow } from "@/lib/business"
import { allocationGroup, ANOMALY_RULES, ANOMALY_SHORT, GROUP_OPTIONS, INVESTMENT_GROUP, type Anomaly, type Severity } from "@/lib/allocation"
import { loadAnalysis } from "@/lib/insights"
import { formatDate, formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Cf = Awaited<ReturnType<typeof prisma.cashflow.findMany>>[number]
type FlowRow = { label: string; amount: number; kind: "start" | "plus" | "minus" | "total"; note?: string; rows?: Cf[] }

export default async function TransparansiPage(props: { searchParams?: Promise<{ year?: string }> }) {
  const searchParams = await props.searchParams
  const [cashflows, payments, snapshot, taught] = await Promise.all([
    prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } }),
    prisma.payment.findMany({ include: { tenant: { include: { building: true } } } }),
    getLatestSnapshot(),
    prisma.groupRule.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  const years = Array.from(new Set(cashflows.map((c) => new Date(c.transaction_date).getFullYear()))).sort((a, b) => b - a)
  const thisYear = new Date().getFullYear()
  const selected = searchParams?.year && searchParams.year !== "all" ? Number(searchParams.year) : "all"
  const start = selected === "all" ? new Date(0) : new Date(selected, 0, 1)
  const end = selected === "all" ? new Date(8640000000000000) : new Date(selected + 1, 0, 1)
  const inPeriod = (d: Date) => d >= start && d < end
  const periodLabel = selected === "all" ? "sejak awal pencatatan" : `tahun ${selected}`
  const includesToday = selected === "all" || selected === thisYear

  const net = (list: Cf[]) => list.reduce((a, c) => a + (c.type === "Pemasukan" ? c.amount : -c.amount), 0)
  const opening = net(cashflows.filter((c) => c.transaction_date < start))
  const periodCfs = cashflows.filter((c) => inPeriod(c.transaction_date))
  const closing = opening + net(periodCfs)

  // Laba bisnis (sama dengan Laporan Bisnis)
  const entries = buildEntries(payments, cashflows).filter((e) => inPeriod(e.date))
  const profit = entries.reduce((a, e) => a + (e.kind === "revenue" ? e.amount : -e.amount), 0)

  // Sewa kos di Pembayaran vs yang masuk rekening
  const kosPaid = payments
    .filter((p) => p.tenant.building?.type !== "Apartemen" && inPeriod(p.transfer_date))
    .reduce((a, p) => a + p.amount, 0)
  const kosInBank = periodCfs
    .filter((c) => c.type === "Pemasukan")
    .filter((c) => {
      const cls = classifyCashflow(c)
      return cls.kind === "business" && cls.segment === "Kos & Kios"
    })
    .reduce((a, c) => a + c.amount, 0)
  const rentGap = kosPaid - kosInBank

  // Transaksi non-bisnis per kelompok
  const groups = new Map<string, { in: number; out: number; rows: Cf[] }>()
  for (const c of periodCfs) {
    const g = allocationGroup(c, taught)
    if (!g) continue
    const key = `${c.type}|${g}`
    const v = groups.get(key) ?? { in: 0, out: 0, rows: [] }
    if (c.type === "Pemasukan") v.in += c.amount
    else v.out += c.amount
    v.rows.push(c)
    groups.set(key, v)
  }
  const inflows = [...groups.entries()].filter(([k]) => k.startsWith("Pemasukan|")).map(([k, v]) => ({ label: k.split("|")[1], amount: v.in, rows: v.rows })).sort((a, b) => b.amount - a.amount)
  const outflows = [...groups.entries()].filter(([k]) => k.startsWith("Pengeluaran|")).map(([k, v]) => ({ label: k.split("|")[1], amount: v.out, rows: v.rows })).sort((a, b) => b.amount - a.amount)
  const totalIn = inflows.reduce((a, g) => a + g.amount, 0)
  const invested = outflows.find((g) => g.label === INVESTMENT_GROUP)?.amount ?? 0
  const spent = outflows.filter((g) => g.label !== INVESTMENT_GROUP).reduce((a, g) => a + g.amount, 0)

  // Harus nol — kalau tidak, ada transaksi yang lolos dari pengelompokan
  const diff = opening + profit - rentGap + totalIn - invested - spent - closing
  const investasi = snapshot?.total_investasi ?? 0

  const flow: FlowRow[] = [
    ...(selected === "all" ? [] : [{ label: `Saldo kas awal ${selected}`, amount: opening, kind: "start" as const }]),
    { label: "Laba bisnis", amount: profit, kind: "plus", note: "Sewa − biaya operasional (sama dengan Laporan Bisnis)" },
    { label: "Sewa tunai yang tidak masuk rekening", amount: -rentGap, kind: rentGap >= 0 ? "minus" : "plus", note: "Tercatat di Pembayaran, tapi tidak ada di Cash Flow (atau sebaliknya)" },
    ...inflows.map((g) => ({ label: g.label, amount: g.amount, kind: "plus" as const, rows: g.rows })),
    ...outflows.map((g) => ({ label: g.label, amount: -g.amount, kind: "minus" as const, rows: g.rows, note: g.label === INVESTMENT_GROUP ? "Tidak hilang — pindah jadi aset investasi" : undefined })),
    { label: selected === "all" ? "Saldo kas sekarang" : `Saldo kas akhir ${selected}`, amount: closing, kind: "total" },
    ...(includesToday
      ? [
          { label: "Investasi (SBR/ORI)", amount: investasi, kind: "plus" as const, note: "Dari data Total Aset di Cash Flow" },
          { label: "Total aset", amount: closing + investasi, kind: "total" as const },
        ]
      : []),
  ]
  const maxAbs = Math.max(...flow.map((f) => Math.abs(f.amount)), 1)

  // Pengeluaran pribadi per kelompok × tahun
  const yearCols = [...years].sort((a, b) => a - b)
  const spendByYear = new Map<string, Record<number, number>>()
  for (const c of cashflows) {
    const g = allocationGroup(c, taught)
    if (!g || c.type !== "Pengeluaran") continue
    const row = spendByYear.get(g) ?? {}
    const y = new Date(c.transaction_date).getFullYear()
    row[y] = (row[y] ?? 0) + c.amount
    spendByYear.set(g, row)
  }
  const spendRows = [...spendByYear.entries()].sort((a, b) => Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0))

  const analysis = await loadAnalysis()
  const anomalies = analysis.anomalies.filter((a) => inPeriod(a.cf.transaction_date))
  const reviewed = analysis.reviewed.filter((a) => inPeriod(a.cf.transaction_date))
  const anomalyCounts = Object.values(ANOMALY_RULES).map((r) => [r, anomalies.filter((a) => a.rule === r).length] as const)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Keuangan"
        title="Transparansi Keuangan"
        description="Menelusuri selisih antara laba bisnis dan total aset: dipakai untuk apa saja, dan transaksi mana yang mungkin salah catat."
        actions={
          <nav aria-label="Pilih periode" className="no-scrollbar inline-flex h-9 max-w-full items-center overflow-x-auto rounded-lg bg-muted p-1">
            {["all", ...years.map(String)].map((y) => (
              <Link
                key={y}
                href={`/dashboard/transparansi?year=${y}`}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                  String(selected) === y ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {y === "all" ? "Semua" : y}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Laba bisnis" icon={ArrowUpRight} tone="success" value={formatRupiah(profit)} hint={periodLabel} />
        <StatCard label="Dipakai di luar bisnis" icon={ArrowDownRight} tone="danger" value={formatRupiah(spent)} hint="Rumah tangga, sedekah, zakat, wakaf, dll." />
        <StatCard label="Dipindah ke investasi" icon={Coins} tone="info" value={formatRupiah(invested)} hint="Pembelian SBR/ORI — tetap jadi aset" />
        <StatCard
          label={includesToday ? "Total aset sekarang" : `Saldo kas akhir ${selected}`}
          icon={Landmark}
          tone="neutral"
          value={formatRupiah(includesToday ? closing + investasi : closing)}
          hint={includesToday ? `Kas ${formatRupiah(closing)} + investasi ${formatRupiah(investasi)}` : "Saldo buku besar"}
        />
      </div>

      <Panel title="Analisis otomatis" description={`Kesimpulan dari data tahun ${thisYear} — diperbarui setiap halaman dibuka`} icon={Sparkles}>
        <InsightList insights={analysis.insights} />
      </Panel>

      <Panel title="Alur uang" description={`Dari laba bisnis sampai ${includesToday ? "total aset" : "saldo kas akhir"} · klik baris untuk lihat transaksinya, dan pindahkan kelompoknya kalau salah (sistem akan mengingatnya)`} icon={Waypoints}>
        {Math.abs(diff) >= 1 && (
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">
            <AlertTriangle className="size-4 shrink-0" /> Rekonsiliasi selisih {formatRupiah(diff)} — ada transaksi yang belum terkelompokkan.
          </p>
        )}
        <ul className="divide-y">
          {flow.map((f, i) => (
            <FlowLine key={`${f.label}-${i}`} row={f} maxAbs={maxAbs} />
          ))}
        </ul>
      </Panel>

      {selected === "all" && (
        <Panel title="Pengeluaran di luar bisnis per tahun" description="Untuk melihat pola: tahun mana pengeluaran tertentu melonjak" icon={Table2} bodyClassName="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Kelompok</TableHead>
                {yearCols.map((y) => <TableHead key={y} className="text-right">{y}</TableHead>)}
                <TableHead className="pr-5 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spendRows.map(([label, byYear]) => (
                <TableRow key={label}>
                  <TableCell className="pl-5 font-medium">{label}</TableCell>
                  {yearCols.map((y) => (
                    <TableCell key={y} className="text-right tabular-nums">
                      {byYear[y] ? formatRupiah(byYear[y]) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                  ))}
                  <TableCell className="pr-5 text-right font-semibold tabular-nums">{formatRupiah(Object.values(byYear).reduce((a, b) => a + b, 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      <Panel
        title="Yang sudah diajarkan"
        description="Kelompok pilihanmu untuk transaksi tertentu. Transaksi baru yang deskripsinya mengandung kata yang sama otomatis ikut."
        icon={GraduationCap}
        bodyClassName={taught.length > 0 ? "p-0 pt-4" : undefined}
      >
        <div className={cn("mb-4", taught.length > 0 && "px-5")}>
          <AiSuggestions enabled={!!process.env.GEMINI_API_KEY} options={GROUP_OPTIONS} />
        </div>
        {taught.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Belum ada. Buka salah satu kelompok di <b>Alur uang</b>, lalu ubah kelompok transaksi yang kurang tepat.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Kalau deskripsi mengandung</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Masuk kelompok</TableHead>
                <TableHead className="w-10 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {taught.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-5 font-medium">&ldquo;{r.keyword}&rdquo;</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{r.type}</TableCell>
                  <TableCell>{r.group}</TableCell>
                  <TableCell className="pr-5"><DeleteRuleButton id={r.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Panel
        title="Perlu dicek"
        description={`Kemungkinan salah catat · ${anomalies.length} temuan ${periodLabel}. Kalau ternyata sudah benar, tandai supaya tidak muncul lagi.`}
        icon={AlertTriangle}
        bodyClassName="p-0 pt-4"
        className="scroll-mt-24"
        id="perlu-dicek"
      >
        {anomalies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-4">
            {anomalyCounts.filter(([, n]) => n > 0).map(([r, n]) => (
              <span key={r} className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">{n} · {ANOMALY_SHORT[r]}</span>
            ))}
          </div>
        )}
        {anomalies.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Tidak ada temuan" description="Tidak ada transaksi yang terlihat janggal di periode ini." />
        ) : (
          <AnomalyTable rows={anomalies} />
        )}
        {reviewed.length > 0 && (
          <details className="group border-t">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 text-[13px] font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              Sudah ditandai benar ({reviewed.length})
            </summary>
            <AnomalyTable rows={reviewed} reviewed />
          </details>
        )}
      </Panel>
    </div>
  )
}

function FlowLine({ row, maxAbs }: { row: FlowRow; maxAbs: number }) {
  const width = `${Math.max(1, (Math.abs(row.amount) / maxAbs) * 100)}%`
  const isTotal = row.kind === "total" || row.kind === "start"
  const content = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_10rem]">
      <div className="flex min-w-0 items-center gap-1.5">
        {row.rows && <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />}
        <div className="min-w-0">
          <p className={cn("truncate text-sm", isTotal ? "font-bold" : "font-medium")}>{row.label}</p>
          {row.note && <p className="truncate text-xs text-muted-foreground">{row.note}</p>}
        </div>
      </div>
      <div className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1">
        <div
          className={cn("h-full rounded-full", isTotal ? "bg-info" : row.amount >= 0 ? "bg-success" : row.label === INVESTMENT_GROUP ? "bg-info/60" : "bg-danger")}
          style={{ width }}
        />
      </div>
      <p className={cn("text-right tabular-nums", isTotal ? "font-bold" : "font-semibold", !isTotal && (row.amount >= 0 ? "text-success" : "text-danger"))}>
        {isTotal ? "= " : row.amount >= 0 ? "+ " : "− "}
        {formatRupiah(Math.abs(row.amount))}
      </p>
    </div>
  )
  if (!row.rows) return <li className={cn(isTotal && "bg-muted/40 -mx-5 px-5")}>{content}</li>
  return (
    <li>
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{content}</summary>
        <ul className="mb-3 max-h-72 space-y-1 overflow-y-auto rounded-lg bg-muted/50 p-3 text-[13px] thin-scrollbar">
          {[...row.rows].sort((a, b) => b.amount - a.amount).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-0.5">
              <span className="min-w-0 flex-1 truncate">
                <span className="text-muted-foreground tabular-nums">{formatDate(c.transaction_date)}</span> · <span className="text-muted-foreground">{c.category}</span> · {c.description}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-medium tabular-nums">{formatRupiah(c.amount)}</span>
                {/* Deskripsi kosong ("-") tidak bisa diajarkan — terlalu umum */}
                {c.description.trim().length >= 3 && !/^(-+|x+|tba)$/i.test(c.description.trim()) && (
                  <GroupPicker type={c.type} description={c.description} current={row.label} options={GROUP_OPTIONS[c.type] ?? []} />
                )}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </li>
  )
}

const SEVERITY: Record<Severity, { label: string; tone: Tone }> = {
  tinggi: { label: "Tinggi", tone: "danger" },
  sedang: { label: "Sedang", tone: "warning" },
  rendah: { label: "Rendah", tone: "neutral" },
}

function AnomalyTable({ rows, reviewed = false }: { rows: Anomaly[]; reviewed?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Tanggal</TableHead>
          <TableHead>Keyakinan</TableHead>
          <TableHead>Temuan</TableHead>
          <TableHead>Transaksi</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
          <TableHead className="pr-5 text-right">Tindakan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a, i) => (
          <TableRow key={`${a.cf.id}-${a.rule}-${i}`} className={cn(reviewed && "opacity-70")}>
            <TableCell className="pl-5 text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(a.cf.transaction_date)}</TableCell>
            <TableCell><StatusPill tone={SEVERITY[a.severity].tone}>{SEVERITY[a.severity].label}</StatusPill></TableCell>
            <TableCell className="min-w-60 max-w-80 whitespace-normal">
              <p className="text-[13px] font-medium">{a.rule}</p>
              <p className="text-xs text-muted-foreground">{a.hint}</p>
            </TableCell>
            <TableCell className="min-w-44 max-w-64 whitespace-normal">
              <p className="text-xs font-semibold text-muted-foreground">{a.cf.category}</p>
              <p className="line-clamp-2 text-[13px]" title={a.cf.description}>{a.cf.description}</p>
            </TableCell>
            <TableCell className={cn("text-right font-semibold whitespace-nowrap tabular-nums", a.cf.type === "Pemasukan" ? "text-success" : "text-danger")}>
              {a.cf.type === "Pemasukan" ? "+" : "−"} {formatRupiah(a.cf.amount)}
            </TableCell>
            <TableCell className="pr-5">
              <div className="flex items-center justify-end gap-1">
                <ReviewButton cashflowId={a.cf.id} rule={a.rule} reviewed={reviewed} />
                <Link
                  href={`/dashboard/cashflow?query=${encodeURIComponent(a.cf.description)}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Buka di Cash Flow"
                  title="Buka di Cash Flow untuk diperbaiki"
                >
                  <Search className="size-4" />
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
