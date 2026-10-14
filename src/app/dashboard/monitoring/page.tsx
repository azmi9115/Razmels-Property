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
        <StatCard label="Tepat waktu bulan ini" icon={CheckCircle2} tone="success" value={countNow("TEPAT")} hint="Sudah bayar sebelum batas 7 hari" />
        <StatCard label="Telat bulan ini" icon={Clock3} tone="warning" value={countNow("TELAT")} hint="Bayar lewat dari 7 hari" />
        <StatCard label="Belum bayar" icon={XCircle} tone={countNow("BELUM BAYAR") > 0 ? "danger" : "neutral"} value={countNow("BELUM BAYAR")} hint="Sudah lewat tanggal jatuh tempo" />
      </div>

      <MonitoringGrid rows={rows} months={months.map(m => m.label)} />
    </div>
  )
}
