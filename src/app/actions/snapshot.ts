"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getLatestSnapshot() {
  const snapshot = await prisma.financialSnapshot.findFirst({
    orderBy: { updated_at: 'desc' }
  })
  return snapshot
}

export async function updateSnapshot(formData: FormData) {
  try {
    const total_tabungan = parseFloat(formData.get("total_tabungan") as string || "0")
    const total_investasi = parseFloat(formData.get("total_investasi") as string || "0")
    const total_rekening = parseFloat(formData.get("total_rekening") as string || "0")

    await prisma.financialSnapshot.create({
      data: {
        total_tabungan,
        total_investasi,
        total_rekening
      }
    })

    revalidatePath("/dashboard/cashflow")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan data keuangan: " + error.message }
  }
}
