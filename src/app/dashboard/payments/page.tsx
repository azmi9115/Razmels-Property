import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CalendarClock, Printer } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddPaymentDialog } from "@/components/add-payment-dialog"
import { PaymentActions } from "@/components/payment-actions"
import { SearchBar } from "@/components/search-bar"
import { PaginationControls } from "@/components/pagination-controls"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function PaymentsPage(props: { searchParams?: Promise<{ query?: string, page?: string }> }) {
  const searchParams = await props.searchParams;
  const query = (searchParams?.query || "").toLowerCase();
  const currentPage = Number(searchParams?.page) || 1;
  const limit = 15;

  const rawPayments = await prisma.payment.findMany({
    include: {
      tenant: {
        include: { building: true }
      }
    },
    orderBy: { transfer_date: "desc" }
  });

  const activeTenants = await prisma.tenant.findMany({
    where: { status: "Active" },
    include: { building: true }
  });

  // Client-side like filtering for complex string matching
  const payments = rawPayments.filter((payment) => {
    if (!query) return true;
    
    const buildingCode = payment.tenant?.building?.code || "";
    const formattedDate = new Date(payment.transfer_date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const paymentId = `${buildingCode} ${new Date(payment.transfer_date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}`;
    const tenantName = payment.tenant?.name || "";

    return (
      paymentId.toLowerCase().includes(query) ||
      formattedDate.toLowerCase().includes(query) ||
      tenantName.toLowerCase().includes(query) ||
      buildingCode.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(payments.length / limit);
  const paginatedPayments = payments.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Pembayaran Sewa
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Catat dan pantau seluruh transaksi pembayaran dari penyewa. (Live Database)
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar placeholder="Cari ID, Tanggal, Penghuni..." />
          <AddPaymentDialog activeTenants={activeTenants} />
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Histori Transaksi Sewa
          </CardTitle>
          <CardDescription>Otomatis mengkalkulasi masa sewa berdasarkan tarif kamar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">ID Pembayaran</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tanggal Transfer</TableHead>
                  <TableHead className="font-semibold text-slate-700">Penghuni & Kamar</TableHead>
                  <TableHead className="font-semibold text-slate-700">Durasi</TableHead>
                  <TableHead className="font-semibold text-slate-700">Jatuh Tempo</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Nominal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                      Tidak ada data yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((payment) => {
                    const tenant = payment.tenant;
                    const building = tenant?.building;

                    return (
                    <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-slate-50 text-slate-600 border-slate-200 shadow-sm">
                          {building?.code || "???"} {new Date(payment.transfer_date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {new Date(payment.transfer_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900">{tenant?.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {building?.code} ({building?.type})
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 font-semibold">
                          {payment.rent_duration_months} Bulan
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <CalendarClock className="h-4 w-4 text-orange-500" />
                          {new Date(payment.rent_end_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-emerald-600">
                          Rp {payment.amount.toLocaleString("id-ID")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/payments/${payment.id}/invoice`}>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </Link>
                          <PaymentActions id={payment.id} />
                        </div>
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
