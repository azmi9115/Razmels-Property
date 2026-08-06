"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createPayment(formData: FormData) {
  try {
    const tenant_id = formData.get("tenant_id") as string
    const amount = Number(formData.get("amount"))
    const transfer_date = formData.get("transfer_date") as string
    const rent_duration_months = Number(formData.get("rent_duration_months"))

    if (!tenant_id || !amount || !transfer_date || !rent_duration_months) {
      return { error: "Semua kolom wajib diisi" }
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id },
      include: { 
        building: true,
        payments: {
          orderBy: { rent_end_date: "desc" },
          take: 1
        }
      }
    })
    
    if (!tenant) return { error: "Data penghuni tidak ditemukan" }

    // Kalkulasi rent_end_date (Jatuh tempo)
    const t_date = new Date(transfer_date)
    let baseDate = new Date(tenant.entry_date)
    
    if (tenant.payments && tenant.payments.length > 0) {
      baseDate = new Date(tenant.payments[0].rent_end_date)
    }
    
    const end_date = new Date(baseDate)
    const targetMonth = end_date.getMonth() + rent_duration_months;
    const intendedMonth = targetMonth % 12;
    
    end_date.setMonth(targetMonth);
    
    // Kembalikan ke tanggal asli masuk (misal masuk tgl 31)
    const originalEntryDay = new Date(tenant.entry_date).getDate();
    end_date.setDate(originalEntryDay);
    
    // Jika bulan lompat karena tanggal tidak ada di bulan tujuan (misal 31 Feb -> 3 Mar)
    if (end_date.getMonth() !== (intendedMonth < 0 ? 12 + intendedMonth : intendedMonth)) {
      end_date.setDate(0); // Mentok ke hari terakhir bulan tujuan (misal 28/29 Feb)
    }

    // 1. Simpan Pembayaran
    await prisma.payment.create({
      data: {
        tenant_id,
        amount,
        transfer_date: t_date,
        rent_duration_months,
        rent_end_date: end_date
      }
    })

    // 2. Simpan ke Cashflow (Buku Besar)
    const buildingCode = tenant.building?.code || "Unknown"

    await prisma.cashflow.create({
      data: {
        type: "Pemasukan",
        category: "Sewa Kamar",
        transaction_date: t_date,
        description: `Pembayaran sewa dari ${tenant.name} (Kamar: ${buildingCode}) untuk ${rent_duration_months} bulan`,
        amount: amount
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/payments")
    revalidatePath("/dashboard/cashflow")
    
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal memproses pembayaran: " + error.message }
  }
}

export async function deletePayment(id: string) {
  try {
    await prisma.payment.delete({ where: { id } })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/payments")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menghapus data: " + error.message }
  }
}
