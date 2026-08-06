import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddCashflowDialog } from "@/components/add-cashflow-dialog"
import { CashflowActions } from "@/components/cashflow-actions"
import { SnapshotCards } from "@/components/snapshot-cards"
import { getLatestSnapshot } from "@/app/actions/snapshot"
import { PaginationControls } from "@/components/pagination-controls"
import { SearchBar } from "@/components/search-bar"
import { SortSelect } from "@/components/sort-select"
import { TypeFilter } from "@/components/type-filter"
import { MarginChart } from "@/components/margin-chart"

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

  // Calculate running balance (oldest to newest)
  let runningBalance = 0
  const cashflowsWithBalance = cashflows.map(cf => {
    if (cf.type === "Pemasukan") {
      runningBalance += cf.amount
    } else {
      runningBalance -= cf.amount
    }
    return { ...cf, balance: runningBalance }
  })
  // Reverse for display (newest first)
  const displayCashflows = [...cashflowsWithBalance].reverse()

  const totalIncome = cashflows.filter(c => c.type === "Pemasukan").reduce((acc, c) => acc + c.amount, 0)
  const totalExpense = cashflows.filter(c => c.type === "Pengeluaran").reduce((acc, c) => acc + c.amount, 0)
  const finalBalance = totalIncome - totalExpense

  // Calculation for Insights
  const allBuildings = await prisma.building.findMany();
  const totalBuildings = allBuildings.length;
  const totalPotensiKotor = allBuildings.reduce((acc, curr) => acc + curr.rent_price, 0);

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

  const activeTenants = tenantsWithPayments.length;
  const kamarKosong = totalBuildings - activeTenants;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let potensiPendapatan = 0;
  let tenantMenunggak = 0;
  let totalTunggakanRp = 0;

  tenantsWithPayments.forEach(tenant => {
    potensiPendapatan += tenant.building?.rent_price || 0;
    const dueDate = tenant.payments && tenant.payments.length > 0
      ? new Date(tenant.payments[0].rent_end_date)
      : new Date(tenant.entry_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      tenantMenunggak++;
      totalTunggakanRp += tenant.building?.rent_price || 0;
    }
  });

  const potensiKosongRp = totalPotensiKotor - potensiPendapatan;
  const proyeksiSaldo = finalBalance + totalTunggakanRp;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const incomeThisMonth = cashflows
    .filter(c => c.type === "Pemasukan" && new Date(c.transaction_date).getMonth() === currentMonth && new Date(c.transaction_date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Margin calculation for chart (All Time)
  type MarginDataType = { month: string, Pemasukan: number, Pengeluaran: number, marginNominal: number, marginPercentage: number, healthStatus: string, healthColor: string };
  const marginDataMap = new Map<string, MarginDataType>();

  // Determine start date from oldest cashflow, or fallback to 6 months ago if no data
  let startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);
  
  if (cashflows.length > 0) {
    const oldestDate = new Date(cashflows[0].transaction_date);
    oldestDate.setDate(1);
    if (oldestDate < startDate) {
      startDate = oldestDate;
    }
  }

  const endDate = new Date();
  endDate.setDate(1); // until current month
  
  // Populate marginDataMap with all months from startDate to endDate
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthStr = `${monthNames[m]} ${y.toString().slice(-2)}`;
    marginDataMap.set(`${y}-${m}`, { 
      month: monthStr, Pemasukan: 0, Pengeluaran: 0, marginNominal: 0, marginPercentage: 0, healthStatus: "N/A", healthColor: "#94a3b8" 
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  cashflows.forEach(cf => {
    const d = new Date(cf.transaction_date);
    const m = d.getMonth();
    const y = d.getFullYear();
    const key = `${y}-${m}`;

    if (marginDataMap.has(key)) {
      const data = marginDataMap.get(key)!;
      if (cf.type === "Pemasukan") data.Pemasukan += cf.amount;
      else data.Pengeluaran += cf.amount;
    }
  });

  let currentMonthMarginHealth = "N/A";
  let currentMonthMarginHealthColor = "text-slate-500 bg-slate-100 border-transparent";
  let currentMonthMarginPercentage = 0;
  let currentMonthMarginNominal = 0;

  const marginChartData = Array.from(marginDataMap.values()).map(data => {
    data.marginNominal = data.Pemasukan - data.Pengeluaran;
    data.marginPercentage = data.Pemasukan > 0 ? (data.marginNominal / data.Pemasukan) * 100 : (data.marginNominal < 0 ? -100 : 0);
    
    if (data.marginPercentage > 30) {
      data.healthStatus = "Sangat Sehat";
      data.healthColor = "#10b981"; // emerald-500
    } else if (data.marginPercentage >= 10) {
      data.healthStatus = "Sehat";
      data.healthColor = "#3b82f6"; // blue-500
    } else if (data.marginPercentage >= 0) {
      data.healthStatus = "Waspada";
      data.healthColor = "#f59e0b"; // amber-500
    } else {
      data.healthStatus = "Rugi / Defisit";
      data.healthColor = "#ef4444"; // red-500
    }
    return data;
  });

  const latestMonthData = marginChartData[marginChartData.length - 1];
  if (latestMonthData) {
     currentMonthMarginPercentage = latestMonthData.marginPercentage;
     currentMonthMarginNominal = latestMonthData.marginNominal;
     if (currentMonthMarginPercentage > 30) {
       currentMonthMarginHealth = "Sangat Sehat";
       currentMonthMarginHealthColor = "text-emerald-700 bg-emerald-100 border-emerald-200";
     } else if (currentMonthMarginPercentage >= 10) {
       currentMonthMarginHealth = "Sehat";
       currentMonthMarginHealthColor = "text-blue-700 bg-blue-100 border-blue-200";
     } else if (currentMonthMarginPercentage >= 0) {
       currentMonthMarginHealth = "Waspada";
       currentMonthMarginHealthColor = "text-orange-700 bg-orange-100 border-orange-200";
     } else {
       currentMonthMarginHealth = "Rugi / Defisit";
       currentMonthMarginHealthColor = "text-red-700 bg-red-100 border-red-200";
     }
  }

  let totalAllTimeMargin = 0;
  let countAllTime = marginChartData.length;
  let totalThisYearMargin = 0;
  let countThisYear = 0;

  const currentYearStr = currentYear.toString().slice(-2);

  marginChartData.forEach(d => {
    totalAllTimeMargin += d.marginPercentage;
    if (d.month.endsWith(` ${currentYearStr}`)) {
      totalThisYearMargin += d.marginPercentage;
      countThisYear++;
    }
  });

  const averageAllTimeMargin = countAllTime > 0 ? (totalAllTimeMargin / countAllTime) : 0;
  const averageThisYearMargin = countThisYear > 0 ? (totalThisYearMargin / countThisYear) : 0;

  // Client-side like filtering
  let filteredCashflows = cashflowsWithBalance.filter(c => {
    // Type Filter
    if (typeFilter !== "all" && c.type !== typeFilter) return false;

    // Search Query
    if (!query) return true;
    const dateStr = new Date(c.transaction_date).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    }).toLowerCase();

    return c.category.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.amount.toString().includes(query) ||
      dateStr.includes(query);
  });

  // Sorting
  if (sort === "date-desc") {
    // We want reverse chronological. Since cashflowsWithBalance is already
    // perfectly chronological (date-asc), we just reverse it to maintain
    // the correct sub-ordering for items on the exact same date.
    filteredCashflows.reverse();
  } else if (sort === "date-asc") {
    // Already in date-asc order, do nothing
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
    { label: "Nominal Tertinggi", value: "amount-desc" },
    { label: "Nominal Terendah", value: "amount-asc" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Arus Kas (Cash Flow)
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Pembukuan umum untuk mencatat pengeluaran operasional dan pendapatan. (Live Database)
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar placeholder="Cari deskripsi, kategori, atau nominal..." />
          <AddCashflowDialog />
        </div>
      </div>

      <SnapshotCards snapshot={snapshot} finalBalance={finalBalance} />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pemasukan</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-emerald-700">Rp {totalIncome.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
              <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-red-600">Rp {totalExpense.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Akhir</span>
              <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className={`text-xl font-bold ${finalBalance >= 0 ? "text-blue-700" : "text-red-600"}`}>
              Rp {finalBalance.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analisis Cerdas Section */}
      <Card className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <CardHeader className="border-b border-indigo-50/50 pb-5 px-6 pt-6">
          <CardTitle className="text-xl font-extrabold text-indigo-950 flex items-center gap-2">
            <span className="text-2xl">💡</span> Analisis Keuangan Cerdas
          </CardTitle>
          <CardDescription className="text-sm font-medium text-indigo-700/70 mt-1">
            Ringkasan performa riil dan proyeksi pendapatan properti Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Performa vs Potensi</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Pemasukan riil bulan ini (<strong className="text-slate-900">Rp {Math.round(incomeThisMonth).toLocaleString("id-ID")}</strong>)
                mencapai <strong className="text-indigo-600">{totalPotensiKotor > 0 ? Math.round((incomeThisMonth / totalPotensiKotor) * 100) : 0}%</strong> dari total potensi kotor
                (Rp {Math.round(totalPotensiKotor).toLocaleString("id-ID")}).
              </p>
            </div>
            <div className="space-y-2 md:border-l border-indigo-100 md:pl-6">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Alasan Kehilangan Potensi</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Terdapat <strong className="text-slate-900">{kamarKosong} kamar kosong</strong> senilai Rp {Math.round(potensiKosongRp).toLocaleString("id-ID")},
                serta <strong className="text-red-600">{tenantMenunggak} penghuni menunggak</strong> dengan total belum tertagih <strong className="text-red-600">Rp {Math.round(totalTunggakanRp).toLocaleString("id-ID")}</strong>.
                <br/><br/>
                Jika penunggak melunasi, Saldo Akhir Anda menjadi <strong className="text-emerald-600 font-bold">Rp {Math.round(proyeksiSaldo).toLocaleString("id-ID")}</strong>.
              </p>
            </div>
            <div className="space-y-2 md:border-l border-indigo-100 md:pl-6">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Proyeksi Saldo Maksimal</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Jika seluruh kamar penuh dan seluruh tagihan dibayar lunas (tanpa tunggakan), maka potensi maksimal Saldo Akhir Anda adalah <strong className="text-emerald-600 font-extrabold text-[15px]">Rp {Math.round(finalBalance + (potensiPendapatan - incomeThisMonth)).toLocaleString("id-ID")}</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Chart Section */}
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-5 px-6 pt-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Grafik Margin Profitabilitas</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
              Perbandingan pemasukan, pengeluaran, dan persentase keuntungan tiap bulan.
              <div className="flex gap-6 mt-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rata-rata Margin (Semua Waktu)</div>
                  <div className="text-base font-extrabold text-slate-700">{averageAllTimeMargin.toFixed(1)}%</div>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rata-rata Margin (Tahun Ini)</div>
                  <div className="text-base font-extrabold text-slate-700">{averageThisYearMargin.toFixed(1)}%</div>
                </div>
              </div>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end text-right shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Bulan Ini</span>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">{currentMonthMarginPercentage.toFixed(1)}%</div>
                <div className={`text-[11px] font-bold ${currentMonthMarginNominal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {currentMonthMarginNominal >= 0 ? '+' : '-'} Rp {Math.abs(currentMonthMarginNominal).toLocaleString("id-ID")}
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold shadow-sm ${currentMonthMarginHealthColor}`}>
                {currentMonthMarginHealth}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[380px] w-full pt-6 px-6 pb-6">
          <MarginChart data={marginChartData} />
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Buku Besar
              </CardTitle>
              <CardDescription>Rekapitulasi keluar masuknya dana dengan saldo berjalan.</CardDescription>
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Urutkan:</span>
              <SortSelect options={sortOptions} />
              <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
              <TypeFilter />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                  <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
                  <TableHead className="font-semibold text-slate-700">Deskripsi</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Nominal</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Saldo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCashflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      Tidak ada data arus kas.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCashflows.map((cf) => {
                    const isIncome = cf.type === "Pemasukan";
                    return (
                      <TableRow key={cf.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-slate-600 font-medium">
                          {new Date(cf.transaction_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isIncome ? (
                              <div className="h-6 w-6 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="font-semibold text-slate-800">{cf.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {cf.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
                            {isIncome ? "+" : "-"} Rp {cf.amount.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${cf.balance >= 0 ? "text-blue-700" : "text-red-600"}`}>
                            Rp {cf.balance.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CashflowActions id={cf.id} />
                        </TableCell>
                      </TableRow>
                    );
                  }))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls totalPages={totalPages} currentPage={currentPage} />
        </CardContent>
      </Card>
    </div>
  )
}
