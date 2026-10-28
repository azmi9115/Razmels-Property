"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { GROUP_OPTIONS } from "@/lib/allocation"

function revalidate() {
  revalidatePath("/dashboard/transparansi")
  revalidatePath("/dashboard")
}

// "Ajari sistem": transaksi dengan deskripsi ini (dan yang mengandungnya) masuk ke kelompok terpilih
export async function teachGroup(type: string, description: string, group: string) {
  try {
    const keyword = description.trim().toLowerCase()
    // Deskripsi pengisi ("-", "XXX") atau terlalu pendek akan cocok dengan terlalu banyak transaksi
    if (keyword.length < 3 || /^(-+|x+|tba|\?+|\.+)$/.test(keyword)) {
      return { error: "Deskripsi terlalu pendek/kosong untuk diajarkan — lengkapi dulu keterangannya di Cash Flow" }
    }
    if (!GROUP_OPTIONS[type]?.includes(group)) return { error: "Kelompok tidak dikenal" }

    await prisma.groupRule.upsert({
      where: { type_keyword: { type, keyword } },
      update: { group },
      create: { type, keyword, group },
    })
    revalidate()
    return { success: true }
  } catch (error) {
    return { error: "Gagal menyimpan ajaran: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function deleteGroupRule(id: string) {
  try {
    await prisma.groupRule.delete({ where: { id } })
    revalidate()
    return { success: true }
  } catch (error) {
    return { error: "Gagal menghapus ajaran: " + (error instanceof Error ? error.message : String(error)) }
  }
}
