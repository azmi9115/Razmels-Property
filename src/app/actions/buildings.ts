"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createBuilding(formData: FormData) {
  try {
    const code = formData.get("code") as string
    const type = formData.get("type") as string
    const rent_price = Number(formData.get("rent_price"))
    const rent_period = formData.get("rent_period") as string

    if (!code || !type || !rent_price || !rent_period) {
      return { error: "Semua kolom wajib diisi" }
    }

    const existingBuilding = await prisma.building.findUnique({
      where: { code }
    })

    if (existingBuilding) {
      return { error: "Kode Kamar sudah terdaftar" }
    }

    await prisma.building.create({
      data: {
        code,
        type,
        rent_price,
        rent_period
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/buildings")
    
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan data: " + error.message }
  }
}

export async function deleteBuilding(id: string) {
  try {
    // Proteksi di sisi server (mencegah penghapusan jika ada penghuni aktif)
    const building = await prisma.building.findUnique({
      where: { id },
      include: { tenants: { where: { status: "Active" } } }
    })

    if (!building) return { error: "Kamar tidak ditemukan" }
    
    if (building.tenants.length > 0) {
      return { error: "Tidak dapat menghapus kamar yang masih dihuni. Harap check-out penghuni terlebih dahulu." }
    }

    await prisma.building.delete({ where: { id } })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/buildings")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menghapus data: " + error.message }
  }
}

export async function updateBuilding(id: string, formData: FormData) {
  try {
    const code = formData.get("code") as string
    const type = formData.get("type") as string
    const rent_price = Number(formData.get("rent_price"))
    const rent_period = formData.get("rent_period") as string

    if (!code || !type || !rent_price || !rent_period) {
      return { error: "Semua kolom wajib diisi" }
    }

    const existingBuilding = await prisma.building.findUnique({
      where: { code }
    })

    if (existingBuilding && existingBuilding.id !== id) {
      return { error: "Kode Kamar sudah dipakai oleh properti lain" }
    }

    await prisma.building.update({
      where: { id },
      data: {
        code,
        type,
        rent_price,
        rent_period
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/buildings")
    
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan data: " + error.message }
  }
}
