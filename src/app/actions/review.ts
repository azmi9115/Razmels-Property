"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Temuan "Perlu dicek" yang dinyatakan benar oleh pemilik — tidak ditandai lagi berikutnya
export async function markReviewed(cashflowId: string, rule: string) {
  try {
    await prisma.cashflowReview.upsert({
      where: { cashflow_id_rule: { cashflow_id: cashflowId, rule } },
      update: {},
      create: { cashflow_id: cashflowId, rule },
    })
    revalidatePath("/dashboard/transparansi")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: "Gagal menyimpan tinjauan: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function unmarkReviewed(cashflowId: string, rule: string) {
  try {
    await prisma.cashflowReview.deleteMany({ where: { cashflow_id: cashflowId, rule } })
    revalidatePath("/dashboard/transparansi")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: "Gagal membatalkan tinjauan: " + (error instanceof Error ? error.message : String(error)) }
  }
}
