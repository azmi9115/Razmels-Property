import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PrintButton } from "@/components/print-button"

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

  const tDate = new Date(payment.transfer_date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  })
  
  const eDate = new Date(payment.rent_end_date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  })

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6 print:space-y-0">
        
        {/* Kontrol (Sembunyikan saat di-print) */}
        <div className="flex items-center justify-between print:hidden mb-6">
          <Link href="/dashboard/payments" className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <PrintButton />
        </div>

        {/* Kertas Invoice */}
        <div className="bg-white p-8 sm:p-12 shadow-md rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">INVOICE SEWA</h1>
              <p className="text-slate-500 mt-1 font-medium">Razmels Property Management</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">NO. REFERENSI</p>
              <p className="text-lg font-bold text-slate-800">INV-{payment.id.split('-')[0].toUpperCase()}</p>
              <p className="text-sm text-slate-500 mt-2">Tanggal: {tDate}</p>
            </div>
          </div>

          {/* Info Penghuni */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">DITAGIHKAN KEPADA</p>
              <p className="text-lg font-bold text-slate-800">{payment.tenant.name}</p>
              <p className="text-slate-600 mt-1">NIK: {payment.tenant.nik}</p>
              <p className="text-slate-600">HP: {payment.tenant.phone_1}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">DETAIL KAMAR</p>
              <p className="text-lg font-bold text-slate-800">
                Kamar {payment.tenant.building?.code || "-"}
              </p>
              <p className="text-slate-600 mt-1">Tipe: {payment.tenant.building?.type || "-"}</p>
            </div>
          </div>

          {/* Tabel Detail */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-y-2 border-slate-200 text-sm">
                <th className="py-3 font-bold text-slate-600 tracking-wider">DESKRIPSI</th>
                <th className="py-3 font-bold text-slate-600 tracking-wider text-center">DURASI</th>
                <th className="py-3 font-bold text-slate-600 tracking-wider text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-800">
                  <p className="font-semibold text-base">Pembayaran Sewa Properti</p>
                  <p className="text-sm text-slate-500 mt-1">Berlaku s/d {eDate}</p>
                </td>
                <td className="py-4 text-center text-slate-800 font-medium">{payment.rent_duration_months} Bulan</td>
                <td className="py-4 text-right font-bold text-slate-800 text-lg">
                  Rp {payment.amount.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mb-16">
            <div className="w-72">
              <div className="flex justify-between py-3 border-t-2 border-slate-800">
                <span className="font-bold text-slate-800 tracking-wider text-sm">TOTAL LUNAS</span>
                <span className="font-bold text-emerald-600 text-xl">Rp {payment.amount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Footer / Tanda Tangan */}
          <div className="mt-16 text-center text-slate-400 text-sm border-t border-slate-100 pt-8">
            <p>Terima kasih telah mempercayakan hunian Anda kepada Razmels Property.</p>
            <p className="mt-1">Invoice ini sah dan di-generate otomatis oleh sistem.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
