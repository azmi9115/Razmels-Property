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

  // Aturan monitoring:
  // - Tiap pembayaran milik satu periode bulan (seperti ID Excel "KODE MMM YY"). Periode awal
  //   = bulan rent_end_date dikurangi durasi; pembayaran multi-bulan menutup beberapa bulan.
  // - Batas bayar = tanggal masuk penghuni di bulan itu (masuk tgl 11 → bayar tiap tgl 11,
  //   dipotong ke akhir bulan kalau bulannya lebih pendek). Transfer ≤ batas → TEPAT, lewat → TELAT.
  // - Batas sudah lewat tapi belum ada pembayaran → BELUM BAYAR; belum lewat → belum tempo.
  const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth()
  const dueDateIn = (year: number, month: number, day: number) =>
    new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()))

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

      const deadline = dueDateIn(year, month, entryDate.getDate())
      const covering = periods.find(p => key >= p.start && key < p.end)
      if (covering) return covering.transferDate <= deadline ? "TEPAT" : "TELAT"
      return today > deadline ? "BELUM BAYAR" : "—"
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
        <StatCard label="Tepat waktu bulan ini" icon={CheckCircle2} tone="success" value={countNow("TEPAT")} hint="Bayar paling lambat tanggal masuk" />
        <StatCard label="Telat bulan ini" icon={Clock3} tone="warning" value={countNow("TELAT")} hint="Bayar lewat dari tanggal masuk" />
        <StatCard label="Belum bayar" icon={XCircle} tone={countNow("BELUM BAYAR") > 0 ? "danger" : "neutral"} value={countNow("BELUM BAYAR")} hint="Sudah lewat tanggal masuk, belum ada pembayaran" />
      </div>

      <MonitoringGrid rows={rows} months={months.map(m => m.label)} currentMonth={formatMonthShort(today.getFullYear(), today.getMonth())} />
    </div>
  )
}
