"use server"

import { createHash } from "crypto"
import { mkdir, readdir, unlink } from "fs/promises"
import path from "path"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { buildPlan, parseWorkbook, wibDate, type Change, type Issue, type Op } from "@/lib/excel-sync"

const MAX_SIZE = 10 * 1024 * 1024
const KEEP_BACKUPS = 10

async function isOwner() {
  const session = await getServerSession(authOptions)
  return (session?.user as { role?: string } | undefined)?.role === "OWNER"
}

async function loadDb() {
  const [buildings, tenants, payments, cashflows, snapshot] = await Promise.all([
    prisma.building.findMany(),
    prisma.tenant.findMany({ include: { building: { select: { code: true } } } }),
    prisma.payment.findMany({ include: { tenant: { select: { name: true, building: { select: { code: true } } } } } }),
    prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } }),
    prisma.financialSnapshot.findFirst({ orderBy: { updated_at: "desc" } }),
  ])
  return { buildings, tenants, payments, cashflows, snapshot }
}

async function planFromForm(formData: FormData) {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file Excel dulu" } as const
  if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) return { error: "File harus Excel (.xlsx / .xlsm)" } as const
  if (file.size > MAX_SIZE) return { error: "File terlalu besar (maks 10 MB)" } as const
  const parsed = parseWorkbook(await file.arrayBuffer())
  if (!parsed.buildings && !parsed.tenants && !parsed.payments && !parsed.cashflows) {
    return { error: "Sheet Bangunan / Daftar Penghuni / Pembayaran Sewa / CashFlow tidak ditemukan — pastikan ini file Master Data dari manager ops" } as const
  }
  const plan = buildPlan(parsed, await loadDb())
  // Sidik jari pratinjau: kalau data web berubah sebelum diverifikasi, pemilik diminta mengunggah ulang
  const token = createHash("sha256").update(JSON.stringify(plan.changes)).digest("hex")
  return { plan, token, fileName: file.name } as const
}

export type PreviewResult =
  | { error: string }
  | { changes: Change[]; issues: Issue[]; token: string; fileName: string; webSaldo: number }

export async function previewExcelSync(formData: FormData): Promise<PreviewResult> {
  try {
    if (!(await isOwner())) return { error: "Khusus pemilik" }
    const res = await planFromForm(formData)
    if ("error" in res) return { error: res.error! }
    const saldo = await prisma.cashflow.groupBy({ by: ["type"], _sum: { amount: true } })
    const webSaldo = saldo.reduce((acc, s) => acc + (s.type === "Pemasukan" ? 1 : -1) * (s._sum.amount ?? 0), 0)
    return { changes: res.plan.changes, issues: res.plan.issues, token: res.token, fileName: res.fileName, webSaldo }
  } catch (error) {
    return { error: "Gagal membaca file: " + (error instanceof Error ? error.message : String(error)) }
  }
}

// Salinan database sebelum update, di folder prisma/backups (ikut volume Docker). Disimpan 10 terakhir.
async function backupDatabase() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  const file = url.replace(/^file:/, "").split("?")[0]
  const dbPath = path.isAbsolute(file) || /^[A-Za-z]:[\\/]/.test(file) ? file : path.join(process.cwd(), "prisma", file)
  const dir = path.join(path.dirname(dbPath), "backups")
  await mkdir(dir, { recursive: true })
  const stamp = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(/[-: ]/g, "").replace(/(\d{8})(\d{6})/, "$1-$2")
  const name = `sebelum-update-excel-${stamp}.db`
  await prisma.$executeRawUnsafe(`VACUUM INTO '${path.join(dir, name).replace(/'/g, "''")}'`)
  const old = (await readdir(dir)).filter((f) => f.startsWith("sebelum-update-excel-")).sort().reverse().slice(KEEP_BACKUPS)
  await Promise.all(old.map((f) => unlink(path.join(dir, f))))
  return name
}

// Akhir sewa: bulan & tahun dari Excel, tanggalnya mengikuti tanggal masuk penghuni (sama seperti impor awal)
function rentEnd(excelEnd: string | null, transfer: string, duration: number, entry: Date) {
  const entryDay = Number(entry.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).slice(8, 10))
  const [y, month] = (excelEnd ?? transfer).split("-").map(Number)
  const m = excelEnd ? month : month + Math.round(duration)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const first = new Date(Date.UTC(y, m - 1, 1))
  const ymd = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(entryDay, lastDay)).padStart(2, "0")}`
  return wibDate(ymd)
}

const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim()

export async function applyExcelSync(formData: FormData) {
  try {
    if (!(await isOwner())) return { error: "Khusus pemilik" }
    const selected: string[] = JSON.parse(String(formData.get("selected") ?? "[]"))
    const res = await planFromForm(formData)
    if ("error" in res) return { error: res.error! }
    if (res.token !== formData.get("token")) {
      return { error: "Data web berubah sejak pratinjau dibuat. Unggah ulang file Excel-nya lalu cek lagi." }
    }
    const { plan } = res
    const chosen = new Set(selected)
    const ops: Op[] = []
    for (const key of selected) {
      const op = plan.ops.get(key)
      if (!op) return { error: "Ada perubahan yang tidak dikenal — unggah ulang file Excel-nya." }
      const change = plan.changes.find((c) => c.key === key)
      const missing = change?.requires?.find((r) => !chosen.has(r))
      if (missing) {
        const need = plan.changes.find((c) => c.key === missing)
        return { error: `"${change!.title}" butuh "${need?.title ?? missing}" ikut dicentang.` }
      }
      ops.push(op)
    }
    if (ops.length === 0) return { error: "Belum ada perubahan yang dicentang" }

    const backup = await backupDatabase()
    const order = ["snapshot", "building", "tenant", "payment", "cashflow"]
    ops.sort((a, b) => order.indexOf(a.entity) - order.indexOf(b.entity))

    await prisma.$transaction(
      async (tx) => {
        let buildings = await tx.building.findMany()
        const buildingId = (code: string) => (code ? buildings.find((b) => norm(b.code) === norm(code))?.id ?? null : null)

        for (const op of ops) {
          if (op.entity === "snapshot") {
            await tx.financialSnapshot.create({ data: op.data })
          } else if (op.entity === "building") {
            if (op.action === "create") await tx.building.create({ data: op.data })
            else await tx.building.update({ where: { id: op.id }, data: op.data })
            buildings = await tx.building.findMany()
          } else if (op.entity === "tenant") {
            if (op.action === "create") {
              const { room, entry_date, exit_date, ...rest } = op.data
              await tx.tenant.create({ data: { ...rest, entry_date: wibDate(entry_date), exit_date: exit_date ? wibDate(exit_date) : null, building_id: buildingId(room) } })
            } else {
              const { entry_date, exit_date, ...rest } = op.data
              await tx.tenant.update({
                where: { id: op.id },
                data: {
                  ...rest,
                  ...(entry_date && { entry_date: wibDate(entry_date) }),
                  ...(exit_date && { exit_date: wibDate(exit_date) }),
                  ...(op.room && { building_id: buildingId(op.room) }),
                },
              })
            }
          } else if (op.entity === "payment") {
            if (op.action === "delete") await tx.payment.delete({ where: { id: op.id } })
            else if (op.action === "create") {
              const { name, room, amount, date, duration, end } = op.data
              const candidates = (await tx.tenant.findMany({ include: { building: true }, orderBy: { entry_date: "desc" } })).filter((t) => norm(t.name) === norm(name))
              const tenant = candidates.find((t) => norm(t.building?.code ?? "") === norm(room)) ?? candidates[0]
              if (!tenant) throw new Error(`Penghuni "${name}" tidak ditemukan untuk pembayaran ${date}`)
              // Arus kas sewa tidak dibuat di sini — sudah tercatat di sheet CashFlow
              await tx.payment.create({
                data: { tenant_id: tenant.id, amount, transfer_date: wibDate(date), rent_duration_months: duration, rent_end_date: rentEnd(end, date, duration, tenant.entry_date) },
              })
            } else {
              const current = await tx.payment.findUniqueOrThrow({ where: { id: op.id }, include: { tenant: true } })
              const { end, transfer_date, ...rest } = op.data
              await tx.payment.update({
                where: { id: op.id },
                data: {
                  ...rest,
                  ...(transfer_date && { transfer_date: wibDate(transfer_date) }),
                  ...(end && { rent_end_date: rentEnd(end, transfer_date ?? "", 0, current.tenant.entry_date) }),
                },
              })
            }
          } else {
            if (op.action === "delete") await tx.cashflow.delete({ where: { id: op.id } })
            else if (op.action === "create") await tx.cashflow.create({ data: { ...op.data, transaction_date: wibDate(op.data.transaction_date) } })
            else {
              const { transaction_date, ...rest } = op.data
              await tx.cashflow.update({ where: { id: op.id }, data: { ...rest, ...(transaction_date && { transaction_date: wibDate(transaction_date) }) } })
            }
          }
        }
      },
      { timeout: 120_000, maxWait: 10_000 }
    )

    revalidatePath("/dashboard", "layout")
    return { success: true, applied: ops.length, backup }
  } catch (error) {
    return { error: "Gagal memperbarui data (tidak ada yang berubah): " + (error instanceof Error ? error.message : String(error)) }
  }
}
