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
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
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
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
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
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
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

      <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
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
