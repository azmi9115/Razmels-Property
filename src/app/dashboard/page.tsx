import Link from "next/link"
import {
  AlarmClock,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CircleAlert,
  FileSpreadsheet,
  HandCoins,
  HeartHandshake,
  MessageCircle,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { StatCard } from "@/components/stat-card"
import { StatusPill } from "@/components/status-pill"
import { EmptyState } from "@/components/empty-state"
import { BreakdownList } from "@/components/breakdown-list"
import { OccupancyRing } from "@/components/occupancy-ring"
import { CashflowChart, CashflowLegend } from "@/components/cashflow-chart"
import { buttonVariants } from "@/components/ui/button"
import { dueLabel, getDueInfo, startOfToday } from "@/lib/rent"
import {
  formatMonthShort,
  formatPercent,
  formatRupiah,
  formatRupiahCompact,
  initials,
  whatsappLink,
} from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const TZ = "Asia/Jakarta"

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date()))
  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

function sumWhere<T extends { amount: number }>(rows: T[], pred: (row: T) => boolean) {
  return rows.reduce((acc, r) => (pred(r) ? acc + r.amount : acc), 0)
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const firstName = (session?.user?.name ?? "").split(" ")[0] || "Admin"

  const [allBuildings, cashflows, activeTenantRows] = await Promise.all([
    prisma.building.findMany(),
    prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } }),
    prisma.tenant.findMany({
      where: { status: "Active" },
      include: { building: true, payments: { orderBy: { rent_end_date: "desc" }, take: 1 } },
    }),
  ])

  // ── Okupansi ───────────────────────────────────────────────
  const totalBuildings = allBuildings.length
  const activeTenants = activeTenantRows.length
  const kamarKosong = Math.max(0, totalBuildings - activeTenants)
  const totalPotensiKotor = allBuildings.reduce((acc, b) => acc + b.rent_price, 0)

  // ── Keuangan ───────────────────────────────────────────────
  const isIncome = (c: { type: string }) => c.type === "Pemasukan"
  const isExpense = (c: { type: string }) => c.type === "Pengeluaran"
  const income = sumWhere(cashflows, isIncome)
  const expense = sumWhere(cashflows, isExpense)
  const saldoAkhir = income - expense
  const profitMargin = income > 0 ? (saldoAkhir / income) * 100 : 0

  const now = new Date()
  const inMonth = (d: Date, offset: number) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const date = new Date(d)
    return date.getMonth() === ref.getMonth() && date.getFullYear() === ref.getFullYear()
  }
  const incomeThisMonth = sumWhere(cashflows, (c) => isIncome(c) && inMonth(c.transaction_date, 0))
  const incomeLastMonth = sumWhere(cashflows, (c) => isIncome(c) && inMonth(c.transaction_date, 1))
  const expenseThisMonth = sumWhere(cashflows, (c) => isExpense(c) && inMonth(c.transaction_date, 0))
  const expenseLastMonth = sumWhere(cashflows, (c) => isExpense(c) && inMonth(c.transaction_date, 1))

  // Grafik 6 bulan terakhir
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    return {
      month: formatMonthShort(ref.getFullYear(), ref.getMonth()),
      Pemasukan: sumWhere(cashflows, (c) => isIncome(c) && inMonth(c.transaction_date, offset)),
      Pengeluaran: sumWhere(cashflows, (c) => isExpense(c) && inMonth(c.transaction_date, offset)),
    }
  })

  // Rincian kategori (semua waktu)
  const byCategory = (pred: (c: { type: string }) => boolean) => {
    const map = new Map<string, number>()
    cashflows.filter(pred).forEach((c) => map.set(c.category, (map.get(c.category) || 0) + c.amount))
    return Array.from(map, ([name, value]) => ({ name, value }))
  }
  const incomeBreakdown = byCategory(isIncome)
  const expenseBreakdown = byCategory(isExpense)

  const zws = ["Zakat", "Wakaf", "Sedekah"].map((name) => ({
    name,
    value: sumWhere(cashflows, (c) => isExpense(c) && c.category === name),
  }))
  const zwsTotal = zws.reduce((a, z) => a + z.value, 0)

  // ── Jatuh tempo & tunggakan ────────────────────────────────
  const today = startOfToday()
  const dueRows = activeTenantRows.map((tenant) => ({
    tenant,
    info: getDueInfo(tenant, today),
    price: tenant.building?.rent_price || 0,
  }))
  const lateRows = dueRows.filter((r) => r.info.state === "late")
  const potensiPendapatan = dueRows.reduce((acc, r) => acc + r.price, 0)
  const totalTunggakanRp = lateRows.reduce((acc, r) => acc + r.price, 0)
  const soonRows = dueRows.filter((r) => r.info.state === "soon")
  const actionRows = [...lateRows, ...soonRows].sort((a, b) => a.info.diffDays - b.info.diffDays)

  const potensiKosongRp = totalPotensiKotor - potensiPendapatan
  const proyeksiSaldo = saldoAkhir + totalTunggakanRp
  const proyeksiMaksimal = saldoAkhir + (potensiPendapatan - incomeThisMonth)
  const capaianBulanIni = totalPotensiKotor > 0 ? (incomeThisMonth / totalPotensiKotor) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("id-ID", { timeZone: TZ, dateStyle: "full" }).format(now)}
        title={
          <>
            {greeting()}, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1]">👋</span>
          </>
        }
        description="Ini ringkasan properti dan keuangan Anda hari ini."
        actions={
          <>
            <a href="/api/export" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <FileSpreadsheet className="size-4" />
              Export Excel
            </a>
            <Link href="/dashboard/payments" className={buttonVariants({ size: "lg" })}>
              <Plus className="size-4" />
              Catat pembayaran
            </Link>
          </>
        }
      />

      {/* ── Hero saldo + okupansi ─────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl bg-brand-navy p-6 text-white shadow-[0_20px_50px_-20px_rgb(11_17_32/0.6)] ring-1 ring-white/5 sm:p-7 xl:col-span-2">
          <div className="grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-300/90 uppercase">Saldo kas bersih</p>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/10">
                Margin {formatPercent(profitMargin, 1)}
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{formatRupiah(saldoAkhir)}</p>
            <p className="mt-2 text-sm text-white/60">
              Dari total pemasukan {formatRupiahCompact(income)} dikurangi pengeluaran {formatRupiahCompact(expense)} sejak awal pencatatan.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <HeroStat label="Pemasukan bulan ini" value={incomeThisMonth} previous={incomeLastMonth} goodWhenUp />
              <HeroStat label="Pengeluaran bulan ini" value={expenseThisMonth} previous={expenseLastMonth} />
              <div className="rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/60">Kalau tunggakan lunas</p>
                <p className="mt-1.5 text-lg font-semibold">{formatRupiahCompact(proyeksiSaldo)}</p>
                <p className="mt-1 text-xs text-emerald-300/90">+{formatRupiahCompact(totalTunggakanRp)} tertagih</p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface flex flex-col p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Okupansi</p>
            <Link href="/dashboard/buildings" className="text-xs font-semibold text-primary hover:underline">
              Lihat unit
            </Link>
          </div>
          <div className="flex flex-1 items-center gap-6 py-4">
            <OccupancyRing filled={activeTenants} total={totalBuildings} />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Unit terisi</dt>
                <dd className="text-lg font-bold">
                  {activeTenants}
                  <span className="text-sm font-medium text-muted-foreground"> / {totalBuildings}</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unit kosong</dt>
                <dd className="text-lg font-bold">{kamarKosong}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl bg-muted/60 px-4 py-3 text-[13px]">
            <span className="text-muted-foreground">Potensi sewa bulanan </span>
            <span className="font-semibold">{formatRupiah(potensiPendapatan)}</span>
          </div>
        </section>
      </div>

      {/* ── KPI ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Menunggak"
          icon={CircleAlert}
          tone={lateRows.length > 0 ? "danger" : "success"}
          value={
            <>
              {lateRows.length} <span className="text-base font-semibold text-muted-foreground">penghuni</span>
            </>
          }
          hint={lateRows.length > 0 ? `${formatRupiah(totalTunggakanRp)} belum tertagih` : "Semua penghuni lancar"}
        />
        <StatCard
          label="Jatuh tempo ≤ 7 hari"
          icon={AlarmClock}
          tone={soonRows.length > 0 ? "warning" : "neutral"}
          value={
            <>
              {soonRows.length} <span className="text-base font-semibold text-muted-foreground">penghuni</span>
            </>
          }
          hint="Siapkan pengingat pembayaran"
        />
        <StatCard
          label="Potensi hilang"
          icon={BedDouble}
          tone="info"
          value={formatRupiahCompact(potensiKosongRp)}
          hint={`${kamarKosong} unit kosong per bulan`}
        />
        <StatCard
          label="Capaian bulan ini"
          icon={Target}
          tone="success"
          value={formatPercent(capaianBulanIni)}
          hint={`dari potensi kotor ${formatRupiahCompact(totalPotensiKotor)}`}
          footer={
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.min(100, capaianBulanIni)}%` }} />
            </div>
          }
        />
      </div>

      {/* ── Perlu tindakan + grafik ─────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-2"
          title="Perlu ditagih"
          description="Penghuni yang telat atau jatuh tempo minggu ini"
          icon={HandCoins}
          actions={
            <Link href="/dashboard/tenants" className="text-xs font-semibold text-primary hover:underline">
              Semua penghuni
            </Link>
          }
          bodyClassName="px-3 pb-3 pt-4"
        >
          {actionRows.length === 0 ? (
            <EmptyState icon={Sparkles} title="Semua beres" description="Tidak ada penghuni yang telat atau jatuh tempo dalam 7 hari." />
          ) : (
            <ul className="thin-scrollbar max-h-[372px] space-y-1 overflow-y-auto pr-1">
              {actionRows.map(({ tenant, info, price }) => {
                const wa = whatsappLink(
                  tenant.phone_1,
                  `Halo ${tenant.name}, ini pengingat dari Razmel's Property: sewa kamar ${tenant.building?.code ?? ""} ${info.state === "late" ? "sudah lewat jatuh tempo" : "segera jatuh tempo"}. Terima kasih 🙏`
                )
                return (
                  <li key={tenant.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-muted/60">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                        info.state === "late" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                      )}
                    >
                      {initials(tenant.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{tenant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tenant.building?.code ?? "—"} · {formatRupiah(price)}
                      </p>
                    </div>
                    <StatusPill tone={info.state === "late" ? "danger" : "warning"} dot>
                      {dueLabel(info)}
                    </StatusPill>
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        title="Kirim pengingat via WhatsApp"
                        aria-label={`Kirim pengingat WhatsApp ke ${tenant.name}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-success-soft hover:text-success"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    ) : (
                      <span className="size-8 shrink-0" />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-3"
          title="Arus kas 6 bulan"
          description="Pemasukan dan pengeluaran per bulan"
          icon={TrendingUp}
          actions={<CashflowLegend data={chartData} />}
        >
          <div className="h-[320px]">
            <CashflowChart data={chartData} />
          </div>
        </Panel>
      </div>

      {/* ── Insight ─────────────────────────────────────────── */}
      <section className="surface overflow-hidden">
        <header className="flex items-center gap-3 border-b px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 text-white">
            <Sparkles className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">Analisis keuangan</h2>
            <p className="text-[13px] text-muted-foreground">Performa riil dibanding potensi properti</p>
          </div>
        </header>
        <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          <Insight label="Performa vs potensi" tone="info">
            Pemasukan bulan ini <b>{formatRupiah(incomeThisMonth)}</b> baru mencapai <b>{formatPercent(capaianBulanIni)}</b> dari potensi kotor{" "}
            <b>{formatRupiah(totalPotensiKotor)}</b>.
          </Insight>
          <Insight label="Sumber kehilangan" tone="danger">
            <b>{kamarKosong} unit kosong</b> senilai {formatRupiah(potensiKosongRp)}/bulan, dan{" "}
            <b className="text-danger">{lateRows.length} penghuni menunggak</b> total {formatRupiah(totalTunggakanRp)}.
          </Insight>
          <Insight label="Proyeksi maksimal" tone="success">
            Jika semua unit terisi dan tagihan lunas, saldo bisa mencapai <b className="text-success">{formatRupiah(proyeksiMaksimal)}</b>.
          </Insight>
        </div>
      </section>

      {/* ── Rincian kategori ────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Rincian pemasukan" description="Semua waktu, per kategori" icon={ArrowUpRight}>
          <BreakdownList items={incomeBreakdown} color="var(--chart-1)" />
        </Panel>
        <Panel title="Rincian pengeluaran" description="Semua waktu, per kategori" icon={ArrowDownRight}>
          <BreakdownList items={expenseBreakdown} color="var(--chart-2)" />
        </Panel>
        <Panel title="Zakat, wakaf & sedekah" description="Porsi amal dari total pemasukan" icon={HeartHandshake}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight">{formatRupiah(zwsTotal)}</p>
              <p className="text-[13px] text-muted-foreground">
                {formatPercent(income > 0 ? (zwsTotal / income) * 100 : 0, 1)} dari total pemasukan
              </p>
            </div>
          </div>
          <BreakdownList items={zws} color="var(--chart-3)" emptyText="Belum ada catatan ZWS" />
        </Panel>
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard/cashflow" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Buka buku besar lengkap
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}

function HeroStat({
  label,
  value,
  previous,
  goodWhenUp = false,
}: {
  label: string
  value: number
  previous: number
  goodWhenUp?: boolean
}) {
  const diff = value - previous
  const up = diff >= 0
  const good = goodWhenUp ? up : !up
  return (
    <div className="rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1.5 text-lg font-semibold">{formatRupiahCompact(value)}</p>
      <p className={cn("mt-1 flex items-center gap-1 text-xs", diff === 0 ? "text-white/50" : good ? "text-emerald-300" : "text-rose-300")}>
        {diff === 0 ? (
          "Sama dengan bulan lalu"
        ) : (
          <>
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {formatRupiahCompact(Math.abs(diff))} vs bulan lalu
          </>
        )}
      </p>
    </div>
  )
}

function Insight({ label, tone, children }: { label: string; tone: "info" | "danger" | "success"; children: React.ReactNode }) {
  const dot = { info: "bg-info", danger: "bg-danger", success: "bg-success" }[tone]
  return (
    <div className="space-y-2 p-5">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <span className={cn("size-1.5 rounded-full", dot)} />
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground/85 [&_b]:font-semibold">{children}</p>
    </div>
  )
}
