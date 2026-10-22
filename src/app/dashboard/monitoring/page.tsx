import prisma from "@/lib/prisma"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import { MonitoringGrid, MonitoringLegend } from "@/components/monitoring-grid"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { formatMonthShort } from "@/lib/format"

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monitoring Sewa",
  description: "Pantau status pembayaran sewa seluruh penghuni per bulan."
}

export default async function MonitoringPage() {
  // Get all active tenants with their payments
  const tenants = await prisma.tenant.findMany({
    where: { status: "Active" },
    include: {
      building: true,
      payments: {
        orderBy: { transfer_date: "asc" }
      }
    },
    orderBy: [
      { building: { code: "asc" } },
      { name: "asc" }
    ]
  })

  // Generate last 11 months (Newest to Oldest) excluding current month
  const months: { label: string; year: number; month: number }[] = []
  for (let i = 1; i <= 11; i++) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push({
      label: formatMonthShort(d.getFullYear(), d.getMonth()),
      year: d.getFullYear(),
      month: d.getMonth() // 0-indexed
    })
  }

  // Calculate status for each tenant x month
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Aturan sama dengan sheet "Monitoring Sewa" di Master Data Kontrakan.xlsm:
  // - Tiap pembayaran milik satu periode bulan (ID Excel "KODE MMM YY"). Periode awal
  //   = bulan rent_end_date dikurangi durasi; pembayaran multi-bulan menutup beberapa bulan.
  // - Batas bayar = tanggal 7 bulan itu untuk SEMUA unit (bukan tanggal masuk).
  //   Transfer ≤ tgl 7 → TEPAT, lewat → TELAT.
  // - Bulan yang sudah mulai tapi belum ada pembayarannya → BELUM BAYAR.
  const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth()

  const rows = tenants.map(tenant => {
    const entryDate = new Date(tenant.entry_date)
    entryDate.setHours(0, 0, 0, 0)
    const exitDate = tenant.exit_date ? new Date(tenant.exit_date) : null
    exitDate?.setHours(0, 0, 0, 0)

    const periods = tenant.payments.map(p => {
      const duration = Math.max(1, Math.round(p.rent_duration_months))
      const start = monthKey(new Date(p.rent_end_date)) - duration
      const transferDate = new Date(p.transfer_date)
      transferDate.setHours(0, 0, 0, 0)
      return { start, end: start + duration, transferDate }
    })

    const statusFor = (year: number, month: number) => {
      const key = year * 12 + month
      // Belum masuk / sudah keluar sebelum bulan ini → KOSONG
      if (key < monthKey(entryDate)) return "KOSONG"
      if (exitDate && key > monthKey(exitDate)) return "KOSONG"

      const covering = periods.find(p => key >= p.start && key < p.end)
      if (covering) {
        const deadline = new Date(year, month, 7)
        return covering.transferDate <= deadline ? "TEPAT" : "TELAT"
      }
      return today >= new Date(year, month, 1) ? "BELUM BAYAR" : "—"
    }

    const statusPerMonth = months.map(({ year, month }) => statusFor(year, month))

    // Pembayaran dengan akhir sewa paling jauh
    const latestPayment = tenant.payments.reduce<(typeof tenant.payments)[number] | null>(
      (latest, p) => (!latest || p.rent_end_date > latest.rent_end_date ? p : latest),
      null
    )

    const currentStatus = statusFor(today.getFullYear(), today.getMonth())

    return {
      id: tenant.id,
      name: tenant.name,
      room: tenant.building?.code || "—",
      masaSewa: tenant.building?.rent_period || "—",
      tglMasuk: tenant.entry_date,
      akhirSewa: latestPayment ? latestPayment.rent_end_date : null,
      currentStatus,
      statusPerMonth
    }
  })

  const countNow = (status: string) => rows.filter((r) => r.currentStatus === status).length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Ringkasan"
        title="Monitoring Sewa"
        description="Riwayat ketepatan bayar setiap penghuni aktif selama 11 bulan terakhir."
        actions={<MonitoringLegend />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tepat waktu bulan ini" icon={CheckCircle2} tone="success" value={countNow("TEPAT")} hint="Bayar paling lambat tanggal 7" />
        <StatCard label="Telat bulan ini" icon={Clock3} tone="warning" value={countNow("TELAT")} hint="Bayar lewat dari tanggal 7" />
        <StatCard label="Belum bayar" icon={XCircle} tone={countNow("BELUM BAYAR") > 0 ? "danger" : "neutral"} value={countNow("BELUM BAYAR")} hint="Belum ada pembayaran untuk bulan ini" />
      </div>

      <MonitoringGrid rows={rows} months={months.map(m => m.label)} currentMonth={formatMonthShort(today.getFullYear(), today.getMonth())} />
    </div>
  )
}
