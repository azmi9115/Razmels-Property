import { ArrowDownRight, ArrowUpRight, BookOpen, Gauge, TrendingUp, Wallet } from "lucide-react"
import prisma from "@/lib/prisma"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddCashflowDialog } from "@/components/add-cashflow-dialog"
import { CashflowActions } from "@/components/cashflow-actions"
import { SnapshotCards } from "@/components/snapshot-cards"
import { getLatestSnapshot } from "@/app/actions/snapshot"
import { PaginationControls } from "@/components/pagination-controls"
import { SearchBar } from "@/components/search-bar"
import { SortSelect } from "@/components/sort-select"
import { TypeFilter } from "@/components/type-filter"
import { MarginChart, type MarginPoint } from "@/components/margin-chart"
import { CashflowChart, CashflowLegend } from "@/components/cashflow-chart"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { EmptyState } from "@/components/empty-state"
import { StatusPill, type Tone } from "@/components/status-pill"
import { formatDate, formatMonthShort, formatPercent, formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic";

function marginHealth(pct: number): { label: string; tone: Tone } {
  if (pct > 30) return { label: "Sangat sehat", tone: "success" }
  if (pct >= 10) return { label: "Sehat", tone: "info" }
  if (pct >= 0) return { label: "Waspada", tone: "warning" }
  return { label: "Rugi / defisit", tone: "danger" }
}

export default async function CashflowPage(props: { searchParams?: Promise<{ page?: string, query?: string, sort?: string, type?: string }> }) {
  const searchParams = await props.searchParams;
  const currentPage = Number(searchParams?.page) || 1;
  const query = (searchParams?.query || "").toLowerCase();
  const sort = searchParams?.sort || "date-desc";
  const typeFilter = searchParams?.type || "all";
  const limit = 15;

  const cashflows = await prisma.cashflow.findMany({
    orderBy: { transaction_date: "asc" }
  });

  const snapshot = await getLatestSnapshot()

  // Saldo berjalan (terlama → terbaru)
  const cashflowsWithBalance = cashflows.reduce<(typeof cashflows[number] & { balance: number })[]>((acc, cf) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].balance : 0
    acc.push({ ...cf, balance: prev + (cf.type === "Pemasukan" ? cf.amount : -cf.amount) })
    return acc
  }, [])

  const totalIncome = cashflows.filter(c => c.type === "Pemasukan").reduce((acc, c) => acc + c.amount, 0)
  const totalExpense = cashflows.filter(c => c.type === "Pengeluaran").reduce((acc, c) => acc + c.amount, 0)
  const finalBalance = totalIncome - totalExpense

  // ── Data bulanan (semua waktu) untuk grafik arus kas & margin ──
  const now = new Date()
  let startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  if (cashflows.length > 0) {
    const oldest = new Date(cashflows[0].transaction_date)
    const oldestMonth = new Date(oldest.getFullYear(), oldest.getMonth(), 1)
    if (oldestMonth < startDate) startDate = oldestMonth
  }
  const endDate = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthMap = new Map<string, MarginPoint>()
  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    monthMap.set(`${d.getFullYear()}-${d.getMonth()}`, {
      month: formatMonthShort(d.getFullYear(), d.getMonth()),
      Pemasukan: 0,
      Pengeluaran: 0,
      marginNominal: 0,
      marginPercentage: 0,
      healthStatus: "N/A",
    })
  }

  cashflows.forEach(cf => {
    const d = new Date(cf.transaction_date);
    const data = monthMap.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (!data) return
    if (cf.type === "Pemasukan") data.Pemasukan += cf.amount;
    else data.Pengeluaran += cf.amount;
  });

  const marginChartData = Array.from(monthMap.values()).map(data => {
    data.marginNominal = data.Pemasukan - data.Pengeluaran;
    data.marginPercentage = data.Pemasukan > 0 ? (data.marginNominal / data.Pemasukan) * 100 : (data.marginNominal < 0 ? -100 : 0);
    data.healthStatus = marginHealth(data.marginPercentage).label
    return data;
  });

  const latestMonth = marginChartData[marginChartData.length - 1]
  // Grafik dimulai dari bulan terbaru di kiri, supaya tidak perlu digeser dulu
  const newestFirst = [...marginChartData].reverse()
  const currentHealth = marginHealth(latestMonth?.marginPercentage ?? 0)

  const currentYearStr = String(now.getFullYear()).slice(-2)
  const avg = (list: MarginPoint[]) => (list.length > 0 ? list.reduce((a, d) => a + d.marginPercentage, 0) / list.length : 0)
  const averageAllTimeMargin = avg(marginChartData)
  const averageThisYearMargin = avg(marginChartData.filter((d) => d.month.endsWith(` ${currentYearStr}`)))

  // ── Buku besar: filter, urutkan, halaman ──
  const filteredCashflows = cashflowsWithBalance.filter(c => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (!query) return true;
    const dateStr = formatDate(c.transaction_date).toLowerCase();
    return c.category.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.amount.toString().includes(query) ||
      dateStr.includes(query);
  });

  if (sort === "date-desc") {
    // Data sudah urut kronologis (date-asc); dibalik supaya urutan transaksi di tanggal yang sama tetap benar
    filteredCashflows.reverse();
  } else if (sort === "amount-desc") {
    filteredCashflows.sort((a, b) => b.amount - a.amount);
  } else if (sort === "amount-asc") {
    filteredCashflows.sort((a, b) => a.amount - b.amount);
  }

  const totalPages = Math.ceil(filteredCashflows.length / limit)
  const paginatedCashflows = filteredCashflows.slice((currentPage - 1) * limit, currentPage * limit)

  const sortOptions = [
    { label: "Terbaru", value: "date-desc" },
    { label: "Terlama", value: "date-asc" },
    { label: "Nominal tertinggi", value: "amount-desc" },
    { label: "Nominal terendah", value: "amount-asc" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Keuangan"
        title="Cash Flow"
        description="Buku besar pemasukan dan pengeluaran, lengkap dengan saldo berjalan."
        actions={
          <>
            <SearchBar placeholder="Cari deskripsi, kategori, nominal…" />
            <AddCashflowDialog />
          </>
        }
      />

      <SnapshotCards snapshot={snapshot} finalBalance={finalBalance} totalIncome={totalIncome} totalExpense={totalExpense} />

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="min-w-0 xl:col-span-3"
          title="Arus kas per bulan"
          description="Terbaru di kiri — geser ke samping untuk bulan lama"
          icon={TrendingUp}
          actions={<CashflowLegend data={marginChartData} />}
        >
          <div className="h-[300px]">
            <CashflowChart data={newestFirst} minPointWidth={56} />
          </div>
        </Panel>

        <Panel
          className="min-w-0 xl:col-span-2"
          title="Margin keuntungan"
          description="Persentase laba tiap bulan"
          icon={Gauge}
          actions={<StatusPill tone={currentHealth.tone} dot>{currentHealth.label}</StatusPill>}
        >
          <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-muted/60 p-3">
            <MiniStat label="Bulan ini" value={formatPercent(latestMonth?.marginPercentage ?? 0, 1)} sub={formatRupiah(latestMonth?.marginNominal ?? 0)} />
            <MiniStat label="Rata-rata tahun ini" value={formatPercent(averageThisYearMargin, 1)} />
            <MiniStat label="Rata-rata semua" value={formatPercent(averageAllTimeMargin, 1)} />
          </div>
          <div className="h-[220px]">
            <MarginChart data={newestFirst} />
          </div>
        </Panel>
      </div>

      <section className="surface overflow-hidden">
        <header className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <BookOpen className="size-[18px]" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold">Buku besar</h2>
              <p className="text-[13px] text-muted-foreground">{filteredCashflows.length} transaksi</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeFilter />
            <SortSelect options={sortOptions} />
          </div>
        </header>

        {paginatedCashflows.length === 0 ? (
          <EmptyState icon={Wallet} title="Tidak ada transaksi" description="Coba ubah filter atau kata kunci pencarian." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCashflows.map((cf) => {
                    const isIncome = cf.type === "Pemasukan";
                    return (
                      <TableRow key={cf.id}>
                        <TableCell className="text-[13px] text-muted-foreground tabular-nums">{formatDate(cf.transaction_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className={cn("flex size-7 items-center justify-center rounded-lg", isIncome ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
                              {isIncome ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                            </span>
                            <span className="font-semibold">{cf.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-sm truncate text-[13px] text-muted-foreground" title={cf.description}>
                          {cf.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("font-semibold tabular-nums", isIncome ? "text-success" : "text-danger")}>
                            {isIncome ? "+" : "−"} {formatRupiah(cf.amount)}
                          </span>
                        </TableCell>
                        <TableCell className={cn("text-right text-[13px] font-medium tabular-nums", cf.balance < 0 && "text-danger")}>
                          {formatRupiah(cf.balance)}
                        </TableCell>
                        <TableCell>
                          <CashflowActions cashflow={cf} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <ul className="divide-y md:hidden">
              {paginatedCashflows.map((cf) => {
                const isIncome = cf.type === "Pemasukan"
                return (
                  <li key={cf.id} className="flex items-start gap-3 p-4">
                    <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", isIncome ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
                      {isIncome ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold">{cf.category}</p>
                        <span className={cn("shrink-0 text-sm font-semibold tabular-nums", isIncome ? "text-success" : "text-danger")}>
                          {isIncome ? "+" : "−"}{formatRupiah(cf.amount)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{cf.description}</p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                        <span>{formatDate(cf.transaction_date)}</span>
                        <span>Saldo {formatRupiah(cf.balance)}</span>
                      </div>
                    </div>
                    <CashflowActions cashflow={cf} />
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <PaginationControls totalPages={totalPages} currentPage={currentPage} />
      </section>
    </div>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-bold tabular-nums">{value}</p>
      {sub && <p className="truncate text-[11px] text-muted-foreground tabular-nums">{sub}</p>}
    </div>
  )
}
