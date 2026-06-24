import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Wallet, TrendingUp, TrendingDown, ArrowRight, AlertCircle, ArrowUpRight, ArrowDownRight, Building, FileSpreadsheet } from "lucide-react"
import prisma from "@/lib/prisma"
import { CashflowChart } from "@/components/cashflow-chart"
import { CategoryPieChart } from "@/components/category-pie-chart"

// Next.js App Router mengizinkan kita melakukan await langsung di komponen
export default async function DashboardPage() {
  // Mengambil data dari SQLite melalui Prisma
  const activeTenants = await prisma.tenant.count({
    where: { status: "Active" }
  });
  
  const totalBuildings = await prisma.building.count();
  const occupancyRate = totalBuildings > 0 ? (activeTenants / totalBuildings) * 100 : 0;
  
  const cashflows = await prisma.cashflow.findMany();
  
  const income = cashflows.filter(c => c.type === "Pemasukan").reduce((acc, curr) => acc + curr.amount, 0)
  const expense = cashflows.filter(c => c.type === "Pengeluaran").reduce((acc, curr) => acc + curr.amount, 0)

  // Hitung data untuk grafik (6 bulan terakhir)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  
  const allCashflows = await prisma.cashflow.findMany({
    where: { transaction_date: { gte: sixMonthsAgo } },
    orderBy: { transaction_date: "asc" }
  })

  const monthlyDataMap = new Map<string, { month: string, Pemasukan: number, Pengeluaran: number }>()
  const incomeCategoryMap = new Map<string, number>()
  const expenseCategoryMap = new Map<string, number>()
  
  // Inisialisasi 6 bulan terakhir
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStr = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
    monthlyDataMap.set(monthStr, { month: monthStr, Pemasukan: 0, Pengeluaran: 0 })
  }

  allCashflows.forEach(cf => {
    // Line chart data
    const monthStr = new Date(cf.transaction_date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
    if (monthlyDataMap.has(monthStr)) {
      const data = monthlyDataMap.get(monthStr)!
      if (cf.type === "Pemasukan") data.Pemasukan += cf.amount
      else data.Pengeluaran += cf.amount
    }

    // Pie chart data
    if (cf.type === "Pemasukan") {
      incomeCategoryMap.set(cf.category, (incomeCategoryMap.get(cf.category) || 0) + cf.amount)
    } else {
      expenseCategoryMap.set(cf.category, (expenseCategoryMap.get(cf.category) || 0) + cf.amount)
    }
  })

  const chartData = Array.from(monthlyDataMap.values())
  
  // Data for Chart 1: Income vs Expense (All Time)
  const incomeVsExpensePieData = [
    { name: "Total Pemasukan", value: income },
    { name: "Total Pengeluaran", value: expense }
  ];

  // Data for Chart 2: Expense by Category (All Time)
  const allTimeExpenseCategoryMap = new Map<string, number>()
  const allTimeIncomeCategoryMap = new Map<string, number>()
  
  cashflows.forEach(cf => {
    if (cf.type === "Pengeluaran") {
      allTimeExpenseCategoryMap.set(cf.category, (allTimeExpenseCategoryMap.get(cf.category) || 0) + cf.amount)
    } else if (cf.type === "Pemasukan") {
      allTimeIncomeCategoryMap.set(cf.category, (allTimeIncomeCategoryMap.get(cf.category) || 0) + cf.amount)
    }
  })
  
  const allTimeExpensePieData = Array.from(allTimeExpenseCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    
  const allTimeIncomePieData = Array.from(allTimeIncomeCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Data for Chart 3: Income vs ZWS (All Time)
  const zakatAmount = cashflows.filter(c => c.type === "Pengeluaran" && c.category === "Zakat").reduce((acc, curr) => acc + curr.amount, 0)
  const wakafAmount = cashflows.filter(c => c.type === "Pengeluaran" && c.category === "Wakaf").reduce((acc, curr) => acc + curr.amount, 0)
  const sedekahAmount = cashflows.filter(c => c.type === "Pengeluaran" && c.category === "Sedekah").reduce((acc, curr) => acc + curr.amount, 0)
  const zwsTotal = zakatAmount + wakafAmount + sedekahAmount;
    
  const zwsVsIncomePieData = [
    { name: "Pemasukan Bersih", value: income > zwsTotal ? income - zwsTotal : 0 },
    { name: "Zakat, Wakaf & Sedekah", value: zwsTotal }
  ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const zwsBreakdownPieData = [
    { name: "Zakat", value: zakatAmount },
    { name: "Wakaf", value: wakafAmount },
    { name: "Sedekah", value: sedekahAmount }
  ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Calculate upcoming due dates
  const tenantsWithPayments = await prisma.tenant.findMany({
    where: { status: "Active" },
    include: {
      building: true,
      payments: {
        orderBy: { rent_end_date: "desc" },
        take: 1
      }
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDueDates = tenantsWithPayments.map(tenant => {
    const dueDate = tenant.payments && tenant.payments.length > 0 
      ? new Date(tenant.payments[0].rent_end_date)
      : new Date(tenant.entry_date);
    
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      name: tenant.name,
      room: tenant.building?.code || "N/A",
      dueDate: dueDate,
      diffDays: diffDays,
      isLate: diffDays < 0,
      isDueSoon: diffDays >= 0 && diffDays <= 7
    };
  })
  .filter(item => item.isLate || item.diffDays <= 30) // Only show late or due within 30 days
  .sort((a, b) => a.diffDays - b.diffDays)
  .slice(0, 5); // Take top 5

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Overview
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Ringkasan performa properti dan keuangan bulan ini.
          </p>
        </div>
        <a 
          href="/api/export" 
          target="_blank" 
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-all font-medium"
        >
          <FileSpreadsheet className="h-4 w-4" /> 
          Export ke Excel
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Pemasukan Card */}
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan</CardTitle>
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-inner">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              Rp {income.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1 bg-green-50 w-max px-2 py-1 rounded-md">
              <ArrowUpRight className="h-3 w-3" /> +20.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        {/* Pengeluaran Card */}
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pengeluaran</CardTitle>
            <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shadow-inner">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              Rp {expense.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-medium text-red-600 mt-2 flex items-center gap-1 bg-red-50 w-max px-2 py-1 rounded-md">
              <ArrowUpRight className="h-3 w-3" /> +4.3% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        {/* Okupansi Card */}
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Kamar Terisi</CardTitle>
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {activeTenants} / {totalBuildings}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Tingkat okupansi: {occupancyRate.toFixed(0)}%
            </p>
            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Kosong Card */}
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Kamar Kosong</CardTitle>
            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
              <Building className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {totalBuildings - activeTenants}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Siap untuk disewakan
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart Section */}
        <Card className="lg:col-span-4 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-800">Grafik Arus Kas (6 Bulan Terakhir)</CardTitle>
            <CardDescription>
              Perbandingan pemasukan sewa dan pengeluaran operasional
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
            <CashflowChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="col-span-3 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Jatuh Tempo Terdekat</CardTitle>
            <CardDescription>Penyewa yang mendekati batas waktu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {upcomingDueDates.length > 0 ? (
                 upcomingDueDates.map((item, index) => (
                   <div key={index} className={`flex items-center gap-4 rounded-xl p-4 border shadow-sm transition-all hover:shadow-md cursor-pointer ${item.isLate ? 'bg-gradient-to-r from-red-50 to-white border-red-100 hover:border-red-200' : item.isDueSoon ? 'bg-gradient-to-r from-orange-50 to-white border-orange-100 hover:border-orange-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.isLate ? 'bg-red-100 text-red-600' : item.isDueSoon ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500">Kamar {item.room}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${item.isLate ? 'text-red-600 bg-red-100' : item.isDueSoon ? 'text-orange-600 bg-orange-100' : 'text-slate-500 bg-slate-100'}`}>
                          {item.isLate ? `Terlewat ${Math.abs(item.diffDays)} Hari` : item.diffDays === 0 ? "Hari Ini" : `Sisa ${item.diffDays} Hari`}
                        </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-slate-500 py-6 text-sm">
                   Tidak ada penghuni yang mendekati jatuh tempo.
                 </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 text-lg">Pemasukan vs Pengeluaran</CardTitle>
            <CardDescription>Rasio keseluruhan dari awal s/d terbaru</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-4 pb-6">
            <CategoryPieChart data={incomeVsExpensePieData} />
          </CardContent>
        </Card>
        
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 text-lg">Rincian Pemasukan</CardTitle>
            <CardDescription>Berdasarkan semua jenis kategori</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-4 pb-6">
            <CategoryPieChart data={allTimeIncomePieData} />
          </CardContent>
        </Card>
        
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 text-lg">Rincian Pengeluaran</CardTitle>
            <CardDescription>Berdasarkan semua jenis kategori</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-4 pb-6">
            <CategoryPieChart data={allTimeExpensePieData} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 text-lg">Penghasilan vs ZWS</CardTitle>
            <CardDescription>Porsi amal (ZWS) dibandingkan total Pemasukan</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-4 pb-6">
            <CategoryPieChart data={zwsVsIncomePieData} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 text-lg">Rincian ZWS</CardTitle>
            <CardDescription>Perbandingan antara Zakat, Wakaf, dan Sedekah</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] w-full pt-4 pb-6">
            <CategoryPieChart data={zwsBreakdownPieData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
