// Analisis otomatis: menyusun kesimpulan dari data (seperti analis membaca laporan)
// dan mengumpulkan temuan "Perlu dicek" yang belum ditinjau pemilik.
import prisma from "@/lib/prisma"
import type { Tone } from "@/components/status-pill"
import { arrearsAsOf, buildEntries, SEGMENTS, unmatchedRentPayments } from "@/lib/business"
import { allocationGroup, detectAnomalies, INVESTMENT_GROUP, type Anomaly } from "@/lib/allocation"
import { formatPercent, formatRupiah } from "@/lib/format"

// pinned = selalu tampil paling depan saat daftar dibatasi (Dashboard)
export type Insight = { tone: Tone; title: string; detail: string; href?: string; pinned?: boolean }

const pctChange = (now: number, before: number) => (before !== 0 ? ((now - before) / Math.abs(before)) * 100 : null)

export async function loadAnalysis() {
  const [cashflows, payments, tenants, buildings, reviews, taught] = await Promise.all([
    prisma.cashflow.findMany({ orderBy: { transaction_date: "asc" } }),
    prisma.payment.findMany({ include: { tenant: { include: { building: true } } } }),
    prisma.tenant.findMany({ include: { building: true, payments: true } }),
    prisma.building.findMany(),
    prisma.cashflowReview.findMany(),
    prisma.groupRule.findMany(),
  ])

  const today = new Date()
  const year = today.getFullYear()
  // Tahun berjalan dibanding periode yang sama tahun lalu
  const ytd = (d: Date) => d >= new Date(year, 0, 1) && d <= today
  const lastYtd = (d: Date) => {
    const end = new Date(today)
    end.setFullYear(year - 1)
    return d >= new Date(year - 1, 0, 1) && d <= end
  }

  // ── Temuan (minus yang sudah ditandai benar) ──
  const reviewedKeys = new Set(reviews.map((r) => `${r.cashflow_id}|${r.rule}`))
  const all = detectAnomalies(cashflows, today)
  const anomalies: Anomaly[] = all.filter((a) => !reviewedKeys.has(`${a.cf.id}|${a.rule}`))
  const reviewed: Anomaly[] = all.filter((a) => reviewedKeys.has(`${a.cf.id}|${a.rule}`))

  // ── Angka dasar ──
  const entries = buildEntries(payments, cashflows)
  const sumProfit = (pred: (d: Date) => boolean, seg?: string) =>
    entries.filter((e) => pred(e.date) && (!seg || e.segment === seg)).reduce((a, e) => a + (e.kind === "revenue" ? e.amount : -e.amount), 0)
  const profitNow = sumProfit(ytd)
  const profitBefore = sumProfit(lastYtd)

  const spendBy = (pred: (d: Date) => boolean) => {
    const m = new Map<string, number>()
    for (const c of cashflows) {
      if (c.type !== "Pengeluaran" || !pred(c.transaction_date)) continue
      const g = allocationGroup(c, taught)
      if (!g || g === INVESTMENT_GROUP) continue
      m.set(g, (m.get(g) ?? 0) + c.amount)
    }
    return m
  }
  const spendNow = spendBy(ytd)
  const spendBefore = spendBy(lastYtd)
  const totalSpendNow = [...spendNow.values()].reduce((a, b) => a + b, 0)

  const insights: Insight[] = []

  // 1. Laba bisnis
  const change = pctChange(profitNow, profitBefore)
  insights.push({
    tone: change === null ? "info" : change >= 0 ? "success" : "warning",
    title: `Laba bisnis ${year}: ${formatRupiah(profitNow)}`,
    detail:
      change === null
        ? "Belum ada pembanding tahun lalu."
        : `${change >= 0 ? "Naik" : "Turun"} ${formatPercent(Math.abs(change), 1)} dibanding periode yang sama tahun lalu (${formatRupiah(profitBefore)}).`,
    href: "/dashboard/bisnis",
  })

  // 2. Aset yang rugi
  for (const s of SEGMENTS) {
    const p = sumProfit(ytd, s)
    if (p < 0) {
      insights.push({
        tone: "danger",
        title: `${s} rugi ${formatRupiah(Math.abs(p))} tahun ini`,
        detail: "Biaya (IPL, perawatan, dll.) lebih besar dari sewa yang masuk — kemungkinan unit sering kosong.",
        href: "/dashboard/bisnis",
      })
    }
  }

  // 3. Porsi laba yang dipakai di luar bisnis
  if (profitNow > 0) {
    const ratio = (totalSpendNow / profitNow) * 100
    insights.push({
      tone: ratio > 100 ? "danger" : ratio > 75 ? "warning" : "info",
      title: `${formatPercent(ratio)} laba tahun ini terpakai di luar bisnis`,
      detail: `${formatRupiah(totalSpendNow)} untuk rumah tangga, sedekah, zakat, wakaf, dll.${ratio > 100 ? " Pengeluaran melebihi laba — tabungan berkurang." : ""}`,
      href: "/dashboard/transparansi",
    })
  }

  // 4. Pengeluaran yang melonjak
  const jumps = [...spendNow.entries()]
    .map(([g, v]) => ({ g, v, before: spendBefore.get(g) ?? 0 }))
    .filter((x) => x.v - x.before >= 3_000_000)
    .sort((a, b) => b.v - b.before - (a.v - a.before))
    .slice(0, 2)
  for (const j of jumps) {
    insights.push({
      tone: "warning",
      title: `Pengeluaran "${j.g}" melonjak`,
      detail: `${formatRupiah(j.v)} tahun ini vs ${formatRupiah(j.before)} di periode yang sama tahun lalu (+${formatRupiah(j.v - j.before)}).`,
      href: "/dashboard/transparansi",
    })
  }

  // 5. Sewa tunai yang tidak masuk rekening
  const cash = unmatchedRentPayments(payments, cashflows).filter((p) => ytd(p.transfer_date))
  if (cash.length > 0) {
    const total = cash.reduce((a, p) => a + p.amount, 0)
    const top = Object.entries(cash.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.tenant.name]: (acc[p.tenant.name] ?? 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([n, k]) => `${n} (${k}×)`)
    insights.push({
      tone: "warning",
      title: `${formatRupiah(total)} sewa tidak masuk rekening`,
      detail: `${cash.length} pembayaran tahun ini tercatat tapi tidak ada di mutasi — paling sering ${top.join(", ")}. Pastikan sudah disetor.`,
      href: "/dashboard/bisnis",
    })
  }

  // 6. Tunggakan saat ini
  const arrears = arrearsAsOf(tenants, today)
  if (arrears.length > 0) {
    insights.push({
      tone: "danger",
      title: `${arrears.length} penghuni menunggak ${formatRupiah(arrears.reduce((a, r) => a + r.amount, 0))}`,
      detail: arrears.slice(0, 3).map((r) => `${r.name} (${r.code}, ${r.months} bln)`).join(", ") + ".",
      href: "/dashboard/monitoring",
    })
  }

  // 7. Unit kosong saat ini
  const occupied = new Set(tenants.filter((t) => t.status === "Active" && t.building_id).map((t) => t.building_id))
  const vacant = buildings.filter((b) => !occupied.has(b.id))
  if (vacant.length > 0) {
    insights.push({
      tone: "info",
      title: `${vacant.length} unit kosong — potensi ${formatRupiah(vacant.reduce((a, b) => a + b.rent_price, 0))}/bulan`,
      detail: vacant.map((b) => b.code).join(", ") + ".",
      href: "/dashboard/buildings",
    })
  }

  // 8. Temuan yang perlu dicek
  const high = anomalies.filter((a) => a.severity === "tinggi").length
  if (anomalies.length > 0) {
    insights.push({
      tone: high > 0 ? "danger" : "warning",
      title: `${anomalies.length} transaksi perlu dicek`,
      detail: `${high} dengan keyakinan tinggi kemungkinan salah catat. Tandai "Sudah benar" kalau memang tidak salah.`,
      href: "/dashboard/transparansi#perlu-dicek",
      pinned: true,
    })
  }

  return { insights, anomalies, reviewed }
}
