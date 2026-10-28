"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { detectAnomalies } from "@/lib/allocation"

function readForm(formData: FormData) {
  const type = formData.get("type") as string
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const amount = Number(formData.get("amount"))
  const transaction_date = formData.get("transaction_date") as string
  if (!type || !category || !description || !amount || !transaction_date) return null
  return { type, category, description, amount, transaction_date: new Date(transaction_date) }
}

function revalidateFinance() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/cashflow")
  revalidatePath("/dashboard/bisnis")
  revalidatePath("/dashboard/transparansi")
}

// Cek transaksi SEBELUM disimpan dengan aturan yang sama seperti "Perlu dicek"
// (salah tipe, salah kategori, dobel, nominal tidak biasa, dst.). excludeId = transaksi yang sedang diubah.
export async function checkCashflowDraft(formData: FormData, excludeId?: string) {
  const draft = readForm(formData)
  if (!draft) return { warnings: [] }
  const existing = await prisma.cashflow.findMany({ where: excludeId ? { id: { not: excludeId } } : undefined })
  const warnings = detectAnomalies([...existing, { ...draft, id: "__draft__" }])
    .filter((a) => a.cf.id === "__draft__")
    .map((a) => ({ rule: a.rule, hint: a.hint, severity: a.severity }))
  return { warnings }
}

// acknowledgedRules = peringatan yang sudah dilihat & disetujui pemilik saat menyimpan —
// langsung ditandai "Sudah benar" supaya tidak muncul lagi di "Perlu dicek"
async function acknowledge(cashflowId: string, rules: string[]) {
  for (const rule of rules) {
    await prisma.cashflowReview.upsert({
      where: { cashflow_id_rule: { cashflow_id: cashflowId, rule } },
      update: {},
      create: { cashflow_id: cashflowId, rule },
    })
  }
}

export async function createCashflow(formData: FormData, acknowledgedRules: string[] = []) {
  try {
    const data = readForm(formData)
    if (!data) return { error: "Semua kolom wajib diisi" }

    const created = await prisma.cashflow.create({ data })
    await acknowledge(created.id, acknowledgedRules)

    revalidateFinance()
    return { success: true }
  } catch (error) {
    return { error: "Gagal menyimpan transaksi: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function updateCashflow(id: string, formData: FormData, acknowledgedRules: string[] = []) {
  try {
    const data = readForm(formData)
    if (!data) return { error: "Semua kolom wajib diisi" }

    await prisma.cashflow.update({ where: { id }, data })
    await acknowledge(id, acknowledgedRules)

    revalidateFinance()
    return { success: true }
  } catch (error) {
    return { error: "Gagal mengubah transaksi: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function deleteCashflow(id: string) {
  try {
    await prisma.cashflow.delete({ where: { id } })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/cashflow")
    return { success: true }
  } catch (error) {
    return { error: "Gagal menghapus data: " + (error instanceof Error ? error.message : String(error)) }
  }
}
