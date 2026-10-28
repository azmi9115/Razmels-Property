// Laporan bisnis properti: pisahkan transaksi usaha (sewa kos/kios + 2 apartemen) dari
// keuangan pribadi/keluarga yang tercampur di buku besar Cash Flow.
// Semua aturan klasifikasi ada di file ini supaya gampang disesuaikan.

export const SEGMENTS = ["Kos & Kios", "Apt DM", "Apt Depok"] as const
export type Segment = (typeof SEGMENTS)[number]

export const SEGMENT_INFO: Record<Segment, string> = {
  "Kos & Kios": "19 unit kamar, kios, dan kontrakan",
  "Apt DM": "Sky Terrace Lagoon, Daan Mogot",
  "Apt Depok": "Grand Taman Melati 2, Depok",
}

type CashflowLike = { type: string; category: string; description: string; amount: number }

export type Classified =
  | { kind: "business"; segment: Segment }
  // Transaksi di kategori usaha tapi bukan pendapatan/biaya operasional
  | { kind: "excluded"; segment: Segment; reason: string }
  | { kind: "personal" }

function segmentOf(cf: CashflowLike): Segment | null {
  const text = `${cf.category} ${cf.description}`.toLowerCase()
  // Apartemen dikenali dari kategori atau nama unit di deskripsi (pembayaran dari form)
  if (/apt dm|sky terrace|daan mogot/.test(text)) return "Apt DM"
  if (/apt depok|taman melati/.test(text)) return "Apt Depok"
  if (["Kontrakan", "Sewa Kamar", "Sewa"].includes(cf.category)) return "Kos & Kios"
  return null
}

// Catatan: pengembalian deposit apartemen SENGAJA dihitung sebagai biaya. Deposit yang diterima
// tercampur di pemasukan sewa (tidak dicatat terpisah), jadi pengembaliannya harus jadi biaya supaya impas.
// "Transfer dari Ibu/Azmi" di Apt Depok juga pendapatan sewa: dulu sewa masuk ke rekening
// lain dulu sebelum disetor ke rekening pusat.
const EXCLUDE_RULES: { test: (cf: CashflowLike, d: string) => boolean; reason: string }[] = [
  { test: (_, d) => d.includes("zakat"), reason: "Zakat (pribadi)" },
  { test: (_, d) => d === "notifikasi", reason: "Biaya notifikasi bank" },
]

export function classifyCashflow(cf: CashflowLike): Classified {
  const segment = segmentOf(cf)
  if (!segment) return { kind: "personal" }
  const d = cf.description.trim().toLowerCase()
  const rule = EXCLUDE_RULES.find((r) => r.test(cf, d))
  if (rule) return { kind: "excluded", segment, reason: rule.reason }
  return { kind: "business", segment }
}

// ── Entri laporan ──
// Pendapatan Kos & Kios diambil dari tabel Pembayaran (catatan sewa lengkap, termasuk yang
// dibayar tunai/lewat pengelola), bukan dari Cash Flow yang hanya berisi uang masuk rekening.
// Pendapatan apartemen & semua biaya operasional diambil dari Cash Flow.
// Biaya punya `costType` (jenis) dan `capex` (investasi/renovasi: barang tahan lama & material,
// bukan biaya rutin bulanan). Total biaya di semua laporan tetap = rutin + investasi.
export type BizEntry = { date: Date; segment: Segment; kind: "revenue" | "opex"; amount: number; costType?: string; capex?: boolean }

const COST_TYPES: { pattern: RegExp; label: string; capex?: boolean }[] = [
  { pattern: /keramik|material|bahan bangunan|\bcat\b|kipas|kasur|pompa|meja|kursi|lampu/, label: "Renovasi & perabot", capex: true },
  { pattern: /pln|listrik|token/, label: "Listrik" },
  { pattern: /ipl|pam|\bair\b/, label: "IPL & air" },
  { pattern: /internet|wifi/, label: "Internet" },
  { pattern: /gaji|thr/, label: "Gaji & THR penjaga" },
  { pattern: /komisi|fee/, label: "Komisi agen" },
  { pattern: /deposit|pengembalian/, label: "Pengembalian deposit/sewa" },
  { pattern: /pajak|pbb/, label: "Pajak & PBB" },
  { pattern: /benerin|perbaikan|sedot|servis|service|pelampung/, label: "Perawatan & perbaikan" },
  { pattern: /parkir/, label: "Parkir" },
]

export function costTypeOf(description: string): { label: string; capex: boolean } {
  const d = description.toLowerCase()
  const t = COST_TYPES.find((c) => c.pattern.test(d))
  return { label: t?.label ?? "Lain-lain", capex: t?.capex ?? false }
}

type PaymentLike = { transfer_date: Date; amount: number; tenant: { building: { type: string } | null } }

export function buildEntries(payments: PaymentLike[], cashflows: (CashflowLike & { transaction_date: Date })[]): BizEntry[] {
  const entries: BizEntry[] = []
  for (const p of payments) {
    if (p.tenant.building?.type === "Apartemen") continue
    entries.push({ date: new Date(p.transfer_date), segment: "Kos & Kios", kind: "revenue", amount: p.amount })
  }
  for (const cf of cashflows) {
    const cls = classifyCashflow(cf)
    if (cls.kind !== "business") continue
    const date = new Date(cf.transaction_date)
    if (cf.type === "Pemasukan") {
      if (cls.segment === "Kos & Kios") continue
      entries.push({ date, segment: cls.segment, kind: "revenue", amount: cf.amount })
    } else {
      const t = costTypeOf(cf.description)
      entries.push({ date, segment: cls.segment, kind: "opex", amount: cf.amount, costType: t.label, capex: t.capex })
    }
  }
  return entries
}

// ── Hunian & tunggakan (dari data penghuni) ──
type TenantLike = {
  name: string
  entry_date: Date
  exit_date: Date | null
  building: { id: string; code: string; type: string; rent_price: number } | null
  payments: { transfer_date: Date; rent_end_date: Date }[]
}

export function segmentOfBuilding(b: { code: string; type: string }): Segment {
  const c = cashflowCategoryForBuilding(b)
  return c === "Apt DM" || c === "Apt Depok" ? c : "Kos & Kios"
}

// Unit dianggap terisi di bulan itu kalau ada penghuni yang tinggal pada tanggal 15
export function occupancyForYear(
  buildings: { id: string; code: string; type: string; rent_price: number }[],
  tenants: TenantLike[],
  year: number,
  lastMonth: number
) {
  const result = Object.fromEntries(
    SEGMENTS.map((s) => [s, { units: 0, unitMonths: 0, occupied: 0, lostRent: 0, hasTenantData: false }])
  ) as Record<Segment, { units: number; unitMonths: number; occupied: number; lostRent: number; hasTenantData: boolean }>

  for (const b of buildings) {
    const r = result[segmentOfBuilding(b)]
    r.units++
    const stays = tenants.filter((t) => t.building?.id === b.id)
    // Ada data penghuni di tahun ini? Kalau tidak sama sekali (mis. apartemen sebelum dicatat), hunian tidak ditampilkan
    const yearStart = new Date(year, 0, 1), yearEnd = new Date(year, 11, 31)
    if (stays.some((t) => new Date(t.entry_date) <= yearEnd && (!t.exit_date || new Date(t.exit_date) >= yearStart))) r.hasTenantData = true
    for (let m = 0; m <= lastMonth; m++) {
      const mid = new Date(year, m, 15)
      r.unitMonths++
      const occupied = stays.some((t) => new Date(t.entry_date) <= mid && (!t.exit_date || new Date(t.exit_date) >= mid))
      if (occupied) r.occupied++
      else r.lostRent += b.rent_price
    }
  }
  return result
}

// Penghuni yang masih tinggal pada `asOf` tapi masa sewanya (dari pembayaran sebelum asOf) sudah habis
export function arrearsAsOf(tenants: TenantLike[], asOf: Date) {
  const rows = []
  for (const t of tenants) {
    if (!t.building) continue
    if (new Date(t.entry_date) > asOf || (t.exit_date && new Date(t.exit_date) <= asOf)) continue
    const paid = t.payments.filter((p) => new Date(p.transfer_date) <= asOf)
    const coveredUntil = paid.reduce((max, p) => (new Date(p.rent_end_date) > max ? new Date(p.rent_end_date) : max), new Date(t.entry_date))
    if (coveredUntil >= asOf) continue
    const months =
      (asOf.getFullYear() - coveredUntil.getFullYear()) * 12 + asOf.getMonth() - coveredUntil.getMonth() + (asOf.getDate() > coveredUntil.getDate() ? 1 : 0)
    rows.push({ name: t.name, code: t.building.code, coveredUntil, months: Math.max(1, months), amount: Math.max(1, months) * t.building.rent_price })
  }
  return rows.sort((a, b) => b.amount - a.amount)
}

// Sewa kos yang tercatat di Pembayaran tapi tidak ketemu pasangannya di Cash Flow
// (nominal sama, selisih tanggal ≤ 10 hari) — kemungkinan dibayar tunai / belum disetor.
// Transfer gabungan beberapa bulan sekaligus juga bisa muncul di sini.
export function unmatchedRentPayments<P extends PaymentLike & { tenant: { name: string; building: { type: string; code: string } | null } }>(
  payments: P[],
  cashflows: (CashflowLike & { id: string; transaction_date: Date })[]
): P[] {
  const DAY = 864e5
  const pool = cashflows.filter((c) => c.type === "Pemasukan" && segmentOf(c) === "Kos & Kios")
  const used = new Set<string>()
  const missing: P[] = []
  for (const p of [...payments].sort((a, b) => +a.transfer_date - +b.transfer_date)) {
    if (p.tenant.building?.type === "Apartemen") continue
    const first = p.tenant.name.split(" ")[0].toLowerCase()
    const code = (p.tenant.building?.code ?? "").toLowerCase()
    const mentions = (c: CashflowLike) => {
      const d = c.description.toLowerCase()
      return d.includes(first) || (code !== "" && d.includes(code)) ? 0 : 1
    }
    const gap = (c: { transaction_date: Date }) => Math.abs(+c.transaction_date - +p.transfer_date)
    const match = pool
      .filter((c) => !used.has(c.id) && Math.abs(c.amount - p.amount) < 1 && gap(c) <= 10 * DAY)
      .sort((a, b) => mentions(a) - mentions(b) || gap(a) - gap(b))[0]
    if (match) used.add(match.id)
    else missing.push(p)
  }
  return missing
}

// Kategori Cash Flow untuk pembayaran sewa dari form/mutasi, sesuai unitnya
export function cashflowCategoryForBuilding(building: { code: string; type: string } | null | undefined): string {
  if (!building) return "Kontrakan"
  const code = building.code.toLowerCase()
  if (building.type === "Apartemen") {
    if (/sky terrace|daan mogot|\bdm\b/.test(code)) return "Apt DM"
    if (/taman melati|depok/.test(code)) return "Apt Depok"
  }
  return "Kontrakan"
}
