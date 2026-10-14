import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ArrowLeft, BadgeCheck } from "lucide-react"
import Link from "next/link"
import { PrintButton } from "@/components/print-button"
import { buttonVariants } from "@/components/ui/button"
import { BrandMark } from "@/components/brand"
import { formatDateLong, formatRupiah, isBlank } from "@/lib/format"

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      tenant: {
        include: { building: true }
      }
    }
  })

  if (!payment) return notFound()

  const tDate = formatDateLong(payment.transfer_date)
  const eDate = formatDateLong(payment.rent_end_date)
  const refNo = `INV-${payment.id.split('-')[0].toUpperCase()}`

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
      <div className="no-print flex items-center justify-between">
        <Link href="/dashboard/payments" className={buttonVariants({ variant: "outline", size: "lg" })}>
          <ArrowLeft className="size-4" /> Kembali
        </Link>
        <PrintButton />
      </div>

      {/* Kertas kuitansi — selalu terang, juga saat dark mode */}
      <article className="relative overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0">
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-indigo-500" />

        <div className="p-8 sm:p-12">
          <header className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4">
              <BrandMark className="size-14 rounded-2xl" />
              <div>
                <p className="text-lg font-bold tracking-tight">Razmel&apos;s Property</p>
                <p className="text-sm text-slate-500">Kuitansi pembayaran sewa</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">No. referensi</p>
              <p className="font-mono text-lg font-bold">{refNo}</p>
              <p className="mt-1 text-sm text-slate-500">{tDate}</p>
            </div>
          </header>

          <div className="grid gap-8 py-8 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">Diterima dari</p>
              <p className="text-lg font-bold">{payment.tenant.name}</p>
              {!isBlank(payment.tenant.nik) && <p className="mt-1 text-sm text-slate-600">NIK {payment.tenant.nik}</p>}
              {!isBlank(payment.tenant.phone_1) && <p className="text-sm text-slate-600">HP {payment.tenant.phone_1}</p>}
            </div>
            <div className="sm:text-right">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">Unit</p>
              <p className="font-mono text-lg font-bold">{payment.tenant.building?.code || "—"}</p>
              <p className="mt-1 text-sm text-slate-600">{payment.tenant.building?.type || "—"}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-slate-200 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
                <th className="py-3 font-semibold">Deskripsi</th>
                <th className="py-3 text-center font-semibold">Durasi</th>
                <th className="py-3 text-right font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-5">
                  <p className="font-semibold">Sewa unit {payment.tenant.building?.code}</p>
                  <p className="mt-1 text-sm text-slate-500">Berlaku sampai {eDate}</p>
                </td>
                <td className="py-5 text-center font-medium">{payment.rent_duration_months} bulan</td>
                <td className="py-5 text-right font-semibold tabular-nums">{formatRupiah(payment.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 flex flex-col-reverse items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="flex -rotate-6 items-center gap-2 rounded-xl border-2 border-emerald-500 px-4 py-2 text-emerald-600">
              <BadgeCheck className="size-6" />
              <span className="text-xl font-extrabold tracking-[0.2em]">LUNAS</span>
            </div>
            <div className="w-full rounded-xl bg-slate-50 p-5 sm:w-72">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">Total dibayar</span>
                <span className="text-2xl font-bold text-emerald-600 tabular-nums">{formatRupiah(payment.amount)}</span>
              </div>
            </div>
          </div>

          <footer className="mt-12 border-t border-slate-100 pt-6 text-center text-sm text-slate-400">
            <p>Terima kasih telah mempercayakan hunian Anda kepada Razmel&apos;s Property.</p>
            <p className="mt-1">Kuitansi ini sah dan dibuat otomatis oleh sistem.</p>
          </footer>
        </div>
      </article>
    </div>
  )
}
