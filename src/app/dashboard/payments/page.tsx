import Link from "next/link"
import { CalendarClock, CalendarRange, CreditCard, Printer, ReceiptText, Wallet } from "lucide-react"
import prisma from "@/lib/prisma"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { AddPaymentDialog } from "@/components/add-payment-dialog"
import { MutationUploadDialog } from "@/components/mutation-upload-dialog"
import { PaymentActions } from "@/components/payment-actions"
import { SearchBar } from "@/components/search-bar"
import { PaginationControls } from "@/components/pagination-controls"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { formatDate, formatRupiah, formatRupiahCompact, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic';

function paymentCode(code: string | undefined, transferDate: Date) {
  return `${code || "???"} ${new Date(transferDate).toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}`
}

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
    const formattedDate = formatDate(payment.transfer_date);
    const paymentId = paymentCode(buildingCode, payment.transfer_date);
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

  // Ringkasan bulan berjalan
  const now = new Date()
  const thisMonth = rawPayments.filter((p) => {
    const d = new Date(p.transfer_date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((a, p) => a + p.amount, 0)
  const allTimeTotal = rawPayments.reduce((a, p) => a + p.amount, 0)
  const lastPayment = rawPayments[0]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Operasional"
        title="Pembayaran"
        description="Catat pembayaran sewa. Masa sewa & jatuh tempo dihitung otomatis dari tarif unit."
        actions={
          <>
            <SearchBar placeholder="Cari nama, kamar, tanggal…" />
            <MutationUploadDialog activeTenants={activeTenants} />
            <AddPaymentDialog activeTenants={activeTenants} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Bulan ini" icon={CalendarRange} tone="success" value={formatRupiahCompact(thisMonthTotal)} hint={`${thisMonth.length} transaksi`} />
        <StatCard label="Total tercatat" icon={Wallet} tone="info" value={formatRupiahCompact(allTimeTotal)} hint={`${rawPayments.length} transaksi sejak awal`} />
        <StatCard
          label="Terakhir masuk"
          icon={ReceiptText}
          tone="neutral"
          value={lastPayment ? formatRupiah(lastPayment.amount) : "—"}
          hint={lastPayment ? `${lastPayment.tenant?.name ?? "—"} · ${formatDate(lastPayment.transfer_date)}` : "Belum ada pembayaran"}
        />
      </div>

      <section className="surface overflow-hidden">
        <header className="flex items-center gap-3 border-b px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <CreditCard className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">Riwayat transaksi</h2>
            <p className="text-[13px] text-muted-foreground">{payments.length} pembayaran{query && ` cocok dengan “${query}”`}</p>
          </div>
        </header>

        {paginatedPayments.length === 0 ? (
          <EmptyState icon={CreditCard} title="Tidak ada pembayaran" description="Coba kata kunci lain atau catat pembayaran baru." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Kode</TableHead>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Tanggal transfer</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Berlaku s/d</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((payment) => {
                    const tenant = payment.tenant;
                    const building = tenant?.building;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <span className="rounded-md border bg-muted/60 px-2 py-1 font-mono text-xs font-medium">
                            {paymentCode(building?.code, payment.transfer_date)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-[11px] font-bold text-muted-foreground">
                              {initials(tenant?.name)}
                            </span>
                            <div>
                              <p className="font-semibold">{tenant?.name || "—"}</p>
                              <p className="text-xs text-muted-foreground">
                                {building?.code} · {building?.type}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground tabular-nums">{formatDate(payment.transfer_date)}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">{payment.rent_duration_months} bln</span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-[13px] font-medium tabular-nums">
                            <CalendarClock className="size-3.5 text-muted-foreground" />
                            {formatDate(payment.rent_end_date)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-success tabular-nums">{formatRupiah(payment.amount)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/payments/${payment.id}/invoice`}
                              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground hover:text-foreground")}
                              title="Cetak kuitansi"
                              aria-label="Cetak kuitansi"
                            >
                              <Printer className="size-4" />
                            </Link>
                            <PaymentActions id={payment.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <ul className="divide-y md:hidden">
              {paginatedPayments.map((payment) => {
                const tenant = payment.tenant
                const building = tenant?.building
                return (
                  <li key={payment.id} className="flex items-center gap-3 p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-[11px] font-bold text-success">
                      {initials(tenant?.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{tenant?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {building?.code} · {formatDate(payment.transfer_date)} · {payment.rent_duration_months} bln
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">s/d {formatDate(payment.rent_end_date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-success tabular-nums">{formatRupiahCompact(payment.amount)}</span>
                      <div className="flex items-center">
                        <Link
                          href={`/dashboard/payments/${payment.id}/invoice`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
                          aria-label="Cetak kuitansi"
                        >
                          <Printer className="size-4" />
                        </Link>
                        <PaymentActions id={payment.id} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <PaginationControls totalPages={totalPages} currentPage={currentPage} />
      </section>
    </div>
  )
}
