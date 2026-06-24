"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCashflow(formData: FormData) {
  try {
    const type = formData.get("type") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const amount = Number(formData.get("amount"))
    const transaction_date = formData.get("transaction_date") as string

    if (!type || !category || !description || !amount || !transaction_date) {
      return { error: "Semua kolom wajib diisi" }
    }

    await prisma.cashflow.create({
      data: {
        type,
        category,
        description,
        amount,
        transaction_date: new Date(transaction_date)
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/cashflow")
    
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan transaksi: " + error.message }
  }
}

export async function deleteCashflow(id: string) {
  try {
    await prisma.cashflow.delete({ where: { id } })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/cashflow")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menghapus data: " + error.message }
  }
}
