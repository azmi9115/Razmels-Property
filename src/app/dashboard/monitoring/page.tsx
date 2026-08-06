import prisma from "@/lib/prisma"
import { MonitoringGrid } from "@/components/monitoring-grid"
import { BarChart3 } from "lucide-react"

export const dynamic = "force-dynamic";

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

  // Generate last 11 months (Newest to Oldest) excluding current month
  const months: { label: string; year: number; month: number }[] = []
  for (let i = 1; i <= 11; i++) {
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

      // Calculate the specific due date for this month based on entryDay
      const entryDay = entryDate.getDate();
      const dueDateThisMonth = new Date(year, month, entryDay);
      // Clamp day if rolled over (e.g. 31st on a 30-day month)
      if (dueDateThisMonth.getMonth() !== month) {
        dueDateThisMonth.setDate(0);
      }
      dueDateThisMonth.setHours(0, 0, 0, 0);

      // Get latest payment's rent_end_date
      const latestPayment = tenant.payments.length > 0
        ? tenant.payments[tenant.payments.length - 1]
        : null;
      
      const rentEndDate = latestPayment ? new Date(latestPayment.rent_end_date) : new Date(entryDate);
      rentEndDate.setHours(0, 0, 0, 0);

      const isPaid = rentEndDate > dueDateThisMonth;

      if (isPaid) {
        // Find which payment covered this cycle
        const coveringPayment = tenant.payments.find(p => new Date(p.rent_end_date) > dueDateThisMonth);
        if (coveringPayment) {
          const transferDate = new Date(coveringPayment.transfer_date);
          transferDate.setHours(0, 0, 0, 0);
          
          // Grace period is due date + 7 days
          const gracePeriod = new Date(dueDateThisMonth);
          gracePeriod.setDate(gracePeriod.getDate() + 7);
          
          return transferDate <= gracePeriod ? "TEPAT" : "TELAT";
        }
        return "TEPAT";
      } else {
        // Not paid
        if (today < dueDateThisMonth) return "—";
        return "BELUM BAYAR";
      }
    })

    // Get latest payment for akhir sewa
    const latestPayment = tenant.payments.length > 0
      ? tenant.payments[tenant.payments.length - 1]
      : null

    // Status bulan ini (current month)
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    const entryDay = new Date(tenant.entry_date).getDate();
    const currentDueDate = new Date(currentYear, currentMonth, entryDay);
    if (currentDueDate.getMonth() !== currentMonth) currentDueDate.setDate(0);
    currentDueDate.setHours(0, 0, 0, 0);

    const rentEndDate = latestPayment ? new Date(latestPayment.rent_end_date) : new Date(tenant.entry_date);
    rentEndDate.setHours(0, 0, 0, 0);

    let currentStatus = "BELUM BAYAR";
    if (rentEndDate > currentDueDate) {
       const coveringPayment = tenant.payments.find(p => new Date(p.rent_end_date) > currentDueDate);
       if (coveringPayment) {
         const transferDate = new Date(coveringPayment.transfer_date);
         transferDate.setHours(0, 0, 0, 0);
         const gracePeriod = new Date(currentDueDate);
         gracePeriod.setDate(gracePeriod.getDate() + 7);
         currentStatus = transferDate <= gracePeriod ? "TEPAT" : "TELAT";
       } else {
         currentStatus = "TEPAT";
       }
    } else {
       if (today < currentDueDate) currentStatus = "—";
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
