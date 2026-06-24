"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTenant(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const nik = formData.get("nik") as string
    const phone_1 = formData.get("phone_1") as string
    const phone_2 = formData.get("phone_2") as string
    const emergency_contact = formData.get("emergency_contact") as string
    const building_id = formData.get("building_id") as string
    const entry_date = formData.get("entry_date") as string
    const id_card_url = formData.get("id_card_url") as string

    if (!name || !nik || !phone_1 || !entry_date) {
      return { error: "Nama, NIK, No. HP, dan Tanggal Masuk wajib diisi" }
    }

    await prisma.tenant.create({
      data: {
        name,
        nik,
        phone_1,
        phone_2: phone_2 || null,
        emergency_contact: emergency_contact || null,
        id_card_url: id_card_url || null,
        entry_date: new Date(entry_date),
        building_id: building_id || null,
        status: "Active"
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/tenants")
    revalidatePath("/dashboard/buildings")
    
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan data: " + error.message }
  }
}

export async function checkoutTenant(id: string) {
  try {
    await prisma.tenant.update({
      where: { id },
      data: {
        status: "Deactive",
        exit_date: new Date()
      }
    })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/tenants")
    revalidatePath("/dashboard/buildings")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal checkout penghuni: " + error.message }
  }
}

export async function deleteTenant(id: string) {
  try {
    await prisma.tenant.delete({ where: { id } })
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/tenants")
    revalidatePath("/dashboard/buildings")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menghapus data: " + error.message }
  }
}

export async function updateTenant(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const nik = formData.get("nik") as string
    const phone_1 = formData.get("phone_1") as string
    const phone_2 = formData.get("phone_2") as string
    const emergency_contact = formData.get("emergency_contact") as string
    const building_id = formData.get("building_id") as string
    const entry_date = formData.get("entry_date") as string
    const id_card_url = formData.get("id_card_url") as string

    if (!name || !nik || !phone_1 || !entry_date) {
      return { error: "Nama, NIK, No. HP, dan Tanggal Masuk wajib diisi" }
    }

    await prisma.tenant.update({
      where: { id },
      data: {
        name,
        nik,
        phone_1,
        phone_2: phone_2 || null,
        emergency_contact: emergency_contact || null,
        ...(id_card_url ? { id_card_url } : {}),
        entry_date: new Date(entry_date),
        building_id: building_id || null,
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/tenants")
    revalidatePath("/dashboard/buildings")
    
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menyimpan data: " + error.message }
  }
}
