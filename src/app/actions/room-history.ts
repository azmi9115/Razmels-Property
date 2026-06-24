"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getRoomHistories(tenantId: string) {
  return await prisma.roomHistory.findMany({
    where: { tenant_id: tenantId },
    include: { building: true },
    orderBy: { moved_in: "desc" }
  })
}

export async function addRoomHistory(formData: FormData) {
  try {
    const tenant_id = formData.get("tenant_id") as string
    const building_id = formData.get("building_id") as string
    const moved_in = formData.get("moved_in") as string
    const moved_out = formData.get("moved_out") as string
    const notes = formData.get("notes") as string

    if (!tenant_id || !building_id || !moved_in) {
      return { error: "Penghuni, kamar, dan tanggal masuk wajib diisi" }
    }

    await prisma.roomHistory.create({
      data: {
        tenant_id,
        building_id,
        moved_in: new Date(moved_in),
        moved_out: moved_out ? new Date(moved_out) : null,
        notes: notes || null
      }
    })

    revalidatePath("/dashboard/tenants")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan riwayat: " + error.message }
  }
}

export async function deleteRoomHistory(id: string) {
  try {
    await prisma.roomHistory.delete({ where: { id } })
    revalidatePath("/dashboard/tenants")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menghapus riwayat: " + error.message }
  }
}
