import prisma from "@/lib/prisma"
import { MonitoringGrid } from "@/components/monitoring-grid"
import { BarChart3 } from "lucide-react"

export const metadata = {
  title: "Monitoring Sewa — Razmel's Property",
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

  // Generate last 12 months
  const months: { label: string; year: number; month: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push({
      label: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      year: d.getFullYear(),
      month: d.getMonth() // 0-indexed
    })
  }

  // Calculate status for each tenant x month
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = tenants.map(tenant => {
    const entryDate = new Date(tenant.entry_date)
    entryDate.setHours(0, 0, 0, 0)

    const statusPerMonth = months.map(({ year, month }) => {
      // First day of this target month
      const monthStart = new Date(year, month, 1)
      monthStart.setHours(0, 0, 0, 0)
      // Last day of this target month
      const monthEnd = new Date(year, month + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)

      // If tenant hadn't moved in yet → KOSONG
      if (entryDate > monthEnd) return "KOSONG"

      // If exit_date exists and tenant left before this month → KOSONG
      if (tenant.exit_date) {
        const exitDate = new Date(tenant.exit_date)
        exitDate.setHours(0, 0, 0, 0)
        if (exitDate < monthStart) return "KOSONG"
      }

      // Find any payment whose transfer_date falls within this month
      const paymentThisMonth = tenant.payments.find(p => {
        const pd = new Date(p.transfer_date)
        pd.setHours(0, 0, 0, 0)
        return pd >= monthStart && pd <= monthEnd
      })

      if (paymentThisMonth) {
        // Check if transfer was within 7 days of the 1st (grace period)
        const transferDay = new Date(paymentThisMonth.transfer_date).getDate()
        return transferDay <= 7 ? "TEPAT" : "TELAT"
      }

      // No payment found for this month
      // If the month is in the future → BELUM BAYAR (expected)
      if (monthStart > today) return "—"

      // If current month → BELUM BAYAR
      return "BELUM BAYAR"
    })

    // Get latest payment for akhir sewa
    const latestPayment = tenant.payments.length > 0
      ? tenant.payments[tenant.payments.length - 1]
      : null

    // Status bulan ini (current month)
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0)
    const paymentThisMonth = tenant.payments.find(p => {
      const pd = new Date(p.transfer_date)
      return pd >= currentMonthStart && pd <= currentMonthEnd
    })
    let currentStatus = "BELUM BAYAR"
    if (paymentThisMonth) {
      const day = new Date(paymentThisMonth.transfer_date).getDate()
      currentStatus = day <= 7 ? "TEPAT" : "TELAT"
    }

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Monitoring Sewa</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-base">
            Status pembayaran sewa seluruh penghuni aktif per bulan.
          </p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> TEPAT
          </span>
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> TELAT
          </span>
          <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> BELUM BAYAR
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> KOSONG
          </span>
        </div>
      </div>

      <MonitoringGrid rows={rows} months={months.map(m => m.label)} />
    </div>
  )
}
