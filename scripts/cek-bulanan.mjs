// Cek bulanan: ringkasan data dari SALINAN database produksi untuk ditinjau Claude (hanya membaca).
// Pakai: node scripts/cek-bulanan.mjs <path-ke-salinan.db> [YYYY-MM]   (default: bulan lalu)
// Hasil: JSON ke stdout — total bulan itu, transaksinya beserta kelompoknya, temuan "Perlu dicek"
// yang belum ditinjau, dan deskripsi yang masih jatuh ke "Lain-lain" (calon ajaran baru).
import { createJiti } from "jiti"
import path from "path"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") } })
const { allocationGroup, detectAnomalies, GROUP_OPTIONS } = await jiti.import("@/lib/allocation")
const { classifyCashflow } = await jiti.import("@/lib/business")

const [dbArg, monthArg] = process.argv.slice(2)
if (!dbArg) {
  console.error("Pakai: node scripts/cek-bulanan.mjs <salinan.db> [YYYY-MM]")
  process.exit(1)
}
const dbPath = path.resolve(dbArg)
const ymd = (d) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
const month = monthArg ?? (() => {
  const now = new Date(ymd(new Date()) + "T00:00:00+07:00")
  now.setMonth(now.getMonth() - 1)
  return ymd(now).slice(0, 7)
})()

const prisma = new PrismaClient({ datasources: { db: { url: "file:" + dbPath.replace(/\\/g, "/") } } })
try {
  // Pastikan yang dibaca benar-benar file salinan (DATABASE_URL pernah tidak terpakai)
  const dbList = await prisma.$queryRawUnsafe("PRAGMA database_list")
  const opened = dbList.find((d) => d.name === "main")?.file ?? ""
  if (path.resolve(opened).toLowerCase() !== dbPath.toLowerCase()) throw new Error(`Yang terbuka ${opened}, bukan ${dbPath}`)

  const [cashflows, reviews, taught] = await Promise.all([
    prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } }),
    prisma.cashflowReview.findMany(),
    prisma.groupRule.findMany({ orderBy: { createdAt: "asc" } }),
  ])
  const inMonth = (cf) => ymd(cf.transaction_date).startsWith(month)
  const row = (cf) => ({
    id: cf.id,
    tanggal: ymd(cf.transaction_date),
    tipe: cf.type,
    kategori: cf.category,
    deskripsi: cf.description,
    jumlah: cf.amount,
    kelompok: allocationGroup(cf, taught) ?? "bisnis: " + classifyCashflow(cf).segment,
  })

  const monthRows = cashflows.filter(inMonth).map(row)
  const sum = (type) => monthRows.filter((r) => r.tipe === type).reduce((a, r) => a + r.jumlah, 0)
  const byCategory = {}
  for (const r of monthRows) byCategory[`${r.tipe} | ${r.kategori}`] = (byCategory[`${r.tipe} | ${r.kategori}`] ?? 0) + r.jumlah

  const reviewed = new Set(reviews.map((r) => `${r.cashflow_id}|${r.rule}`))
  const anomalies = detectAnomalies(cashflows)
    .filter((a) => !reviewed.has(`${a.cf.id}|${a.rule}`))
    .map((a) => ({ ...row(a.cf), aturan: a.rule, tingkat: a.severity, saran: a.hint }))

  // Deskripsi non-bisnis yang belum punya kelompok (seluruh data), dikelompokkan per deskripsi
  const fallback = new Map()
  for (const cf of cashflows) {
    const g = allocationGroup(cf, taught)
    if (g !== "Lain-lain" && g !== "Pemasukan lain") continue
    const d = cf.description.trim().toLowerCase()
    if (d.length < 3 || /^(-+|x+|tba|\?+|\.+)$/.test(d)) continue
    const k = `${cf.type}|${d}`
    const e = fallback.get(k) ?? { tipe: cf.type, deskripsi: d, kategori: cf.category, kali: 0, total: 0, terakhir: "" }
    e.kali++
    e.total += cf.amount
    e.terakhir = ymd(cf.transaction_date)
    fallback.set(k, e)
  }

  const saldo = cashflows.reduce((a, cf) => a + (cf.type === "Pemasukan" ? cf.amount : -cf.amount), 0)
  console.log(JSON.stringify({
    bulan: month,
    database: opened,
    saldoKasSemua: saldo,
    totalBulanIni: { pemasukan: sum("Pemasukan"), pengeluaran: sum("Pengeluaran"), selisih: sum("Pemasukan") - sum("Pengeluaran") },
    perKategori: byCategory,
    transaksiBulanIni: monthRows,
    perluDicekBelumDitinjau: { jumlah: anomalies.length, bulanIni: anomalies.filter((a) => a.tanggal.startsWith(month)), lainnya: anomalies.filter((a) => !a.tanggal.startsWith(month)).length },
    calonAjaran: [...fallback.values()].sort((a, b) => b.total - a.total),
    ajaranTersimpan: taught.map((t) => ({ tipe: t.type, keyword: t.keyword, kelompok: t.group })),
    pilihanKelompok: GROUP_OPTIONS,
  }, null, 2))
} finally {
  await prisma.$disconnect()
}
