"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  })
}

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    if (!name || !email || !password || !role) {
      return { error: "Semua kolom wajib diisi" }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "Email sudah digunakan oleh akun lain" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal membuat akun: " + error.message }
  }
}

export async function updateUser(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const password = formData.get("password") as string

    if (!name || !email || !role) {
      return { error: "Nama, email, dan role wajib diisi" }
    }

    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id } }
    })
    if (existing) {
      return { error: "Email sudah digunakan oleh akun lain" }
    }

    const updateData: any = { name, email, role }
    
    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({ where: { id }, data: updateData })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal mengupdate akun: " + error.message }
  }
}

export async function deleteUser(id: string) {
  try {
    // Prevent deleting OWNER accounts
    const user = await prisma.user.findUnique({ where: { id } })
    if (user?.role === "OWNER") {
      return { error: "Akun Owner tidak dapat dihapus" }
    }

    await prisma.user.delete({ where: { id } })
    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error: any) {
    return { error: "Gagal menghapus akun: " + error.message }
  }
}
