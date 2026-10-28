// Update data dari Excel manager operasional (masa transisi).
// Membaca "Master Data Kontrakan.xlsm", mencocokkan tiap baris dengan data web, lalu menyusun
// daftar perubahan yang ditinjau pemilik sebelum diterapkan. Tidak ada yang ditulis di sini —
// penulisan ke database ada di src/app/actions/excel-sync.ts.
import * as XLSX from "xlsx"

// ---------- Tipe hasil yang dikirim ke halaman ----------

export type Entity = "snapshot" | "building" | "tenant" | "payment" | "cashflow"
export type ChangeKind = "add" | "update" | "webOnly"
export type FieldDiff = { field: string; before: string; after: string }

export type Change = {
  key: string
  entity: Entity
  kind: ChangeKind
  title: string
  subtitle?: string
  fields?: FieldDiff[]
  note?: string
  // Bisa dicentang? (data yang hanya ada di web untuk penghuni/bangunan hanya informasi)
  selectable: boolean
  defaultOn: boolean
  // Pengaruh ke saldo kas web kalau diterapkan (khusus cash flow)
  saldoDelta?: number
  // Perubahan lain yang wajib ikut dicentang (mis. pembayaran untuk penghuni baru)
  requires?: string[]
}

export type Issue = { sheet: string; row?: number; message: string }

// ---------- Tipe internal: data Excel yang sudah dirapikan ----------

type XBuilding = { row: number; code: string; type: string; price: number; period: string }
type XTenant = { row: number; name: string; room: string; nik: string; phone1: string; phone2: string; emergency: string; entry: string | null; exit: string | null; active: boolean }
type XPayment = { row: number; name: string; room: string; amount: number; date: string; duration: number; end: string | null }
type XCashflow = { row: number; type: "Pemasukan" | "Pengeluaran"; category: string; date: string; description: string; amount: number }
type XSnapshot = { tabungan: number; investasi: number; rekening: number; asOf: string }

export type ParsedWorkbook = {
  buildings: XBuilding[] | null // null = sheet tidak ada → bagian ini tidak dibandingkan
  tenants: XTenant[] | null
  payments: XPayment[] | null
  cashflows: XCashflow[] | null
  snapshot: XSnapshot | null
  issues: Issue[]
}

// ---------- Data web yang dibandingkan ----------

export type DbData = {
  buildings: { id: string; code: string; type: string; rent_price: number; rent_period: string }[]
  tenants: { id: string; name: string; nik: string; phone_1: string; phone_2: string | null; emergency_contact: string | null; entry_date: Date; exit_date: Date | null; status: string; building: { code: string } | null }[]
  payments: { id: string; amount: number; transfer_date: Date; rent_duration_months: number; rent_end_date: Date; tenant: { name: string; building: { code: string } | null } }[]
  cashflows: { id: string; type: string; category: string; description: string; amount: number; transaction_date: Date }[]
  snapshot: { total_tabungan: number; total_investasi: number; total_rekening: number } | null
}

// ---------- Operasi yang dijalankan saat "Verifikasi & update" ----------

export type Op =
  | { entity: "snapshot"; action: "create"; data: { total_tabungan: number; total_investasi: number; total_rekening: number } }
  | { entity: "building"; action: "create"; data: { code: string; type: string; rent_price: number; rent_period: string } }
  | { entity: "building"; action: "update"; id: string; data: { rent_price?: number; rent_period?: string } }
  | { entity: "tenant"; action: "create"; data: TenantData & { room: string } }
  | { entity: "tenant"; action: "update"; id: string; data: Partial<TenantData>; room?: string }
  | { entity: "payment"; action: "create"; data: { name: string; room: string; amount: number; date: string; duration: number; end: string | null } }
  | { entity: "payment"; action: "update"; id: string; data: { amount?: number; transfer_date?: string; rent_duration_months?: number; end?: string } }
  | { entity: "payment" | "cashflow"; action: "delete"; id: string }
  | { entity: "cashflow"; action: "create"; data: CashflowData }
  | { entity: "cashflow"; action: "update"; id: string; data: Partial<CashflowData> }

type TenantData = { name: string; nik: string; phone_1: string; phone_2: string | null; emergency_contact: string | null; entry_date: string; exit_date: string | null; status: string }
type CashflowData = { type: string; category: string; description: string; amount: number; transaction_date: string }

export type SyncPlan = { changes: Change[]; ops: Map<string, Op>; issues: Issue[] }

// ---------- Bantuan umum ----------

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim())
const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim()
const headerKey = (v: unknown) => str(v).toLowerCase().replace(/[^a-z0-9]/g, "")
const money = (n: number) => Math.round(n * 100) / 100
// NIK "0", telepon "-" dan sejenisnya = belum diisi
const blank = (v: string | null | undefined) => !v || /^(-+|0|null|undefined)$/i.test(v.trim())
const digits = (v: string) => v.replace(/\D/g, "")

// Tanggal disimpan sebagai tengah malam WIB; dibandingkan sebagai "YYYY-MM-DD"
export const ymdWib = (d: Date | null) => (d ? d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }) : null)
export const wibDate = (ymd: string) => new Date(`${ymd}T00:00:00+07:00`)
const dayDiff = (a: string, b: string) => Math.abs(wibDate(a).getTime() - wibDate(b).getTime()) / 864e5
const showDate = (ymd: string | null) =>
  ymd ? wibDate(ymd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }) : "—"
const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`

// Sel tanggal Excel: angka seri, atau teks "2026-10-01" / "1/10/2026" (hari/bulan/tahun)
function excelDate(v: unknown): string | null | "invalid" {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number" && v > 0) return new Date(Math.round((Math.floor(v) - 25569) * 864e5)).toISOString().slice(0, 10)
  const s = str(v)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return valid(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
  if (m) return valid(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1])
  return "invalid"
}
function valid(y: number, mo: number, d: number): string | "invalid" {
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCMonth() !== mo - 1 || y < 2000 || y > 2100) return "invalid"
  return dt.toISOString().slice(0, 10)
}

function excelNumber(v: unknown): number | null {
  if (typeof v === "number") return v
  const s = str(v).replace(/rp/i, "").replace(/\s/g, "")
  if (!s) return null
  // "750.000" / "750,000" / "-1.500"
  const n = Number(s.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", "."))
  return Number.isFinite(n) ? n : null
}

// ---------- Membaca workbook ----------

type Sheet = { name: string; rows: unknown[][]; firstRow: number }

function findSheet(wb: XLSX.WorkBook, ...names: string[]): Sheet | null {
  const name = wb.SheetNames.find((n) => names.some((want) => norm(n) === norm(want)))
  if (!name) return null
  const ws = wb.Sheets[name]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null, blankrows: true })
  const firstRow = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]).s.r + 1 : 1
  return { name, rows, firstRow }
}

// Cari baris judul kolom (mis. yang memuat "Tipe" dan "Jumlah"), lalu petakan nama kolom → indeks
function findHeader(sheet: Sheet, required: string[]) {
  const want = required.map(headerKey)
  const idx = sheet.rows.findIndex((r) => want.every((w) => r.some((c) => headerKey(c) === w)))
  if (idx < 0) return null
  const header = sheet.rows[idx].map(headerKey)
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(headerKey(n))
      if (i >= 0) return i
    }
    return -1
  }
  return { idx, col }
}

export function parseWorkbook(buffer: ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(buffer, { type: "array" })
  const issues: Issue[] = []
  const missing = (name: string) => issues.push({ sheet: name, message: `Sheet "${name}" tidak ditemukan — bagian ini tidak dibandingkan` })
  const dateOf = (sheet: Sheet, i: number, v: unknown, what: string): string | null | "invalid" => {
    const d = excelDate(v)
    if (d === "invalid") issues.push({ sheet: sheet.name, row: sheet.firstRow + i, message: `${what} "${str(v)}" tidak terbaca sebagai tanggal` })
    return d
  }

  // Bangunan
  let buildings: XBuilding[] | null = null
  const sb = findSheet(wb, "Bangunan")
  const hb = sb && findHeader(sb, ["Kode Bangunan", "Biaya Sewa"])
  if (!sb || !hb) missing("Bangunan")
  else {
    const [cCode, cType, cPrice, cPeriod] = [hb.col("Kode Bangunan"), hb.col("Tipe Bangunan"), hb.col("Biaya Sewa"), hb.col("Periode Sewa")]
    buildings = []
    sb.rows.slice(hb.idx + 1).forEach((r, j) => {
      const code = str(r[cCode])
      if (!code) return
      const price = excelNumber(r[cPrice])
      if (price === null) return void issues.push({ sheet: sb.name, row: sb.firstRow + hb.idx + 1 + j, message: `Biaya sewa ${code} kosong/tidak terbaca` })
      buildings!.push({ row: sb.firstRow + hb.idx + 1 + j, code, type: str(r[cType]), price, period: str(r[cPeriod]) || "Bulanan" })
    })
  }

  // Daftar Penghuni
  let tenants: XTenant[] | null = null
  const st = findSheet(wb, "Daftar Penghuni")
  const ht = st && findHeader(st, ["Nama Penghuni", "Tgl. Masuk"])
  if (!st || !ht) missing("Daftar Penghuni")
  else {
    const c = {
      name: ht.col("Nama Penghuni"),
      room: ht.col("Kode Bangunan2", "Kode Bangunan"),
      nik: ht.col("No. NIK", "NIK"),
      p1: ht.col("No. Kontak 1"),
      p2: ht.col("No. Kontak 2"),
      em: ht.col("No. Darurat"),
      entry: ht.col("Tgl. Masuk"),
      exit: ht.col("Tgl. Keluar"),
      status: ht.col("Status"),
    }
    tenants = []
    st.rows.slice(ht.idx + 1).forEach((r, j) => {
      const i = ht.idx + 1 + j
      const name = str(r[c.name])
      if (!name) return
      const entry = dateOf(st, i, r[c.entry], `Tgl. masuk ${name}`)
      const exit = dateOf(st, i, r[c.exit], `Tgl. keluar ${name}`)
      tenants!.push({
        row: st.firstRow + i,
        name,
        room: str(r[c.room]),
        nik: str(r[c.nik]),
        phone1: str(r[c.p1]),
        phone2: str(r[c.p2]),
        emergency: str(r[c.em]),
        entry: entry === "invalid" ? null : entry,
        exit: exit === "invalid" ? null : exit,
        active: norm(str(r[c.status])) === "active",
      })
    })
  }

  // Pembayaran Sewa
  let payments: XPayment[] | null = null
  const sp = findSheet(wb, "Pembayaran Sewa")
  const hp = sp && findHeader(sp, ["Nama Penghuni", "Tgl. Transfer"])
  if (!sp || !hp) missing("Pembayaran Sewa")
  else {
    const c = { name: hp.col("Nama Penghuni"), room: hp.col("Kode Bangunan"), amount: hp.col("Nominal"), date: hp.col("Tgl. Transfer"), dur: hp.col("Masa Sewa1", "Masa Sewa"), end: hp.col("Akhir Sewa") }
    payments = []
    sp.rows.slice(hp.idx + 1).forEach((r, j) => {
      const i = hp.idx + 1 + j
      const name = str(r[c.name])
      if (!name) return
      const date = dateOf(sp, i, r[c.date], `Tgl. transfer ${name}`)
      const amount = excelNumber(r[c.amount])
      if (date === null || date === "invalid") return
      if (amount === null) return void issues.push({ sheet: sp.name, row: sp.firstRow + i, message: `Nominal pembayaran ${name} kosong/tidak terbaca` })
      const end = excelDate(r[c.end])
      // Masa sewa di Excel kadang pecahan hasil rumus (1,08 / 0,5) — dibulatkan ke bulan penuh seperti impor awal
      const duration = Math.max(1, Math.round(excelNumber(r[c.dur]) ?? 1))
      payments!.push({ row: sp.firstRow + i, name, room: str(r[c.room]), amount: money(amount), date, duration, end: end === "invalid" ? null : end })
    })
  }

  // CashFlow + ringkasan saldo di atasnya
  let cashflows: XCashflow[] | null = null
  let snapshot: XSnapshot | null = null
  const sc = findSheet(wb, "CashFlow", "Cash Flow")
  const hc = sc && findHeader(sc, ["Tipe", "Jenis", "Tanggal", "Jumlah"])
  if (!sc || !hc) missing("CashFlow")
  else {
    const c = { type: hc.col("Tipe"), cat: hc.col("Jenis"), date: hc.col("Tanggal"), desc: hc.col("Deskripsi"), amount: hc.col("Jumlah") }
    cashflows = []
    sc.rows.slice(hc.idx + 1).forEach((r, j) => {
      const i = hc.idx + 1 + j
      const amount = excelNumber(r[c.amount])
      const rawDate = r[c.date]
      if ((amount === null || amount === 0) && !str(rawDate)) return
      const date = dateOf(sc, i, rawDate, "Tanggal")
      if (date === "invalid") return
      if (date === null) return void issues.push({ sheet: sc.name, row: sc.firstRow + i, message: "Tanggal kosong — baris dilewati" })
      if (amount === null || amount === 0) return void issues.push({ sheet: sc.name, row: sc.firstRow + i, message: "Jumlah kosong — baris dilewati" })
      // Tanda minus pada Jumlah yang dipakai (sama seperti rumus saldo di Excel), bukan kolom Tipe
      const type = amount > 0 ? "Pemasukan" : "Pengeluaran"
      const tipe = str(r[c.type])
      if (tipe && (tipe === "Kredit") !== (amount > 0)) {
        issues.push({ sheet: sc.name, row: sc.firstRow + i, message: `Tipe "${tipe}" tidak sesuai tanda angka ${amount.toLocaleString("id-ID")} — dipakai tanda angka (${type})` })
      }
      cashflows!.push({ row: sc.firstRow + i, type, category: str(r[c.cat]) || "Lain-lain", date, description: str(r[c.desc]) || "-", amount: money(Math.abs(amount)) })
    })

    // "Update Tabungan/ Cash per 18-Oct-26:" dst. di baris-baris atas
    const found: Partial<Record<"tabungan" | "investasi" | "rekening", number>> = {}
    let asOf = ""
    for (const r of sc.rows.slice(0, hc.idx)) {
      for (let k = 0; k < r.length - 1; k++) {
        const label = str(r[k])
        const value = typeof r[k + 1] === "number" ? (r[k + 1] as number) : null
        if (!label || value === null) continue
        const which = /tabungan|cash/i.test(label) ? "tabungan" : /investasi/i.test(label) ? "investasi" : /rekening/i.test(label) ? "rekening" : null
        if (!which) continue
        found[which] = money(value)
        asOf ||= label.match(/per\s+([^:]+)/i)?.[1]?.trim() ?? ""
      }
    }
    if (found.tabungan !== undefined && found.investasi !== undefined && found.rekening !== undefined) {
      snapshot = { tabungan: found.tabungan, investasi: found.investasi, rekening: found.rekening, asOf }
    }
  }

  return { buildings, tenants, payments, cashflows, snapshot, issues }
}

// ---------- Pencocokan ----------

// Cocokkan dua daftar bertahap: dulu yang persis sama (kunci), lalu yang mirip (skor terkecil menang)
function pairUp<X, D>(
  xs: X[],
  ds: D[],
  passes: ({ key: (x: X | D, side: "x" | "d") => string } | { score: (x: X, d: D) => number | null })[]
) {
  let restX = [...xs]
  let restD = [...ds]
  const pairs: { x: X; d: D; pass: number }[] = []
  passes.forEach((p, pass) => {
    if ("key" in p) {
      const pool = new Map<string, D[]>()
      for (const d of restD) {
        const k = p.key(d, "d")
        pool.set(k, [...(pool.get(k) ?? []), d])
      }
      const left: X[] = []
      for (const x of restX) {
        const hit = pool.get(p.key(x, "x"))?.shift()
        if (hit) pairs.push({ x, d: hit, pass })
        else left.push(x)
      }
      const used = new Set(pairs.map((q) => q.d))
      restX = left
      restD = restD.filter((d) => !used.has(d))
    } else {
      const left: X[] = []
      for (const x of restX) {
        let best: D | null = null
        let bestScore = Infinity
        for (const d of restD) {
          const s = p.score(x, d)
          if (s !== null && s < bestScore) [best, bestScore] = [d, s]
        }
        if (best) {
          pairs.push({ x, d: best, pass })
          restD = restD.filter((d) => d !== best)
        } else left.push(x)
      }
      restX = left
    }
  })
  return { pairs, onlyX: restX, onlyD: restD }
}

// ---------- Menyusun daftar perubahan ----------

export function buildPlan(x: ParsedWorkbook, db: DbData): SyncPlan {
  const changes: Change[] = []
  const ops = new Map<string, Op>()
  const issues = [...x.issues]
  const add = (c: Change, op?: Op) => {
    changes.push(c)
    if (op) ops.set(c.key, op)
  }

  // Ringkasan saldo (FinancialSnapshot)
  if (x.snapshot) {
    const s = x.snapshot
    const cur = db.snapshot
    const fields: FieldDiff[] = []
    const cmp = (label: string, before: number | undefined, after: number) => {
      if (before === undefined || Math.abs(before - after) >= 1) fields.push({ field: label, before: before === undefined ? "—" : rupiah(before), after: rupiah(after) })
    }
    cmp("Tabungan/Cash", cur?.total_tabungan, s.tabungan)
    cmp("Investasi", cur?.total_investasi, s.investasi)
    cmp("Total rekening", cur?.total_rekening, s.rekening)
    if (fields.length) {
      add(
        { key: "snapshot", entity: "snapshot", kind: "update", title: "Saldo tabungan, investasi & rekening", subtitle: s.asOf ? `Per ${s.asOf} (dari atas sheet CashFlow)` : undefined, fields, selectable: true, defaultOn: true },
        { entity: "snapshot", action: "create", data: { total_tabungan: s.tabungan, total_investasi: s.investasi, total_rekening: s.rekening } }
      )
    }
  }

  // Bangunan
  const buildingCodes = new Set(db.buildings.map((b) => norm(b.code)))
  if (x.buildings) {
    const { pairs, onlyX, onlyD } = pairUp(x.buildings, db.buildings, [{ key: (b, side) => norm(side === "x" ? (b as XBuilding).code : (b as DbData["buildings"][number]).code) }])
    for (const { x: xb, d } of pairs) {
      const fields: FieldDiff[] = []
      const data: { rent_price?: number; rent_period?: string } = {}
      if (Math.abs(d.rent_price - xb.price) >= 1) {
        fields.push({ field: "Biaya sewa", before: rupiah(d.rent_price), after: rupiah(xb.price) })
        data.rent_price = xb.price
      }
      if (norm(d.rent_period) !== norm(xb.period)) {
        fields.push({ field: "Periode", before: d.rent_period, after: xb.period })
        data.rent_period = xb.period
      }
      if (fields.length) add({ key: `building:upd:${d.id}`, entity: "building", kind: "update", title: d.code, fields, selectable: true, defaultOn: true }, { entity: "building", action: "update", id: d.id, data })
    }
    for (const xb of onlyX) {
      const type = /apart/i.test(xb.type) ? "Apartemen" : /kontrakan/i.test(xb.type) ? "Kontrakan" : /kios/i.test(xb.type) || /^D[AB]/i.test(xb.code) ? "Kios" : "Kamar"
      add(
        { key: `building:add:${norm(xb.code)}`, entity: "building", kind: "add", title: xb.code, subtitle: `${type} · ${rupiah(xb.price)} / ${xb.period}`, selectable: true, defaultOn: true },
        { entity: "building", action: "create", data: { code: xb.code, type, rent_price: xb.price, rent_period: xb.period } }
      )
    }
    for (const d of onlyD) {
      add({ key: `building:web:${d.id}`, entity: "building", kind: "webOnly", title: d.code, subtitle: `${d.type} · ${rupiah(d.rent_price)}`, note: "Tidak ada di sheet Bangunan — dibiarkan", selectable: false, defaultOn: false })
    }
  }
  const newBuildingKey = (code: string) => (x.buildings ? changes.find((c) => c.key === `building:add:${norm(code)}`)?.key : undefined)
  const knownRoom = (code: string) => buildingCodes.has(norm(code)) || !!newBuildingKey(code)

  // Penghuni
  const tenantNewKeys = new Map<string, string>() // nama|kamar → key penghuni baru
  if (x.tenants) {
    type D = DbData["tenants"][number]
    const nameOf = (t: XTenant | D) => norm(t.name)
    const roomOf = (t: XTenant | D, side: "x" | "d") => norm(side === "x" ? (t as XTenant).room : ((t as D).building?.code ?? ""))
    const entryOf = (t: XTenant | D, side: "x" | "d") => (side === "x" ? (t as XTenant).entry : ymdWib((t as D).entry_date)) ?? ""
    const { pairs, onlyX, onlyD } = pairUp<XTenant, D>(x.tenants, db.tenants, [
      { key: (t, s) => [nameOf(t as XTenant), roomOf(t as XTenant, s), entryOf(t as XTenant, s)].join("|") },
      { key: (t, s) => [nameOf(t as XTenant), roomOf(t as XTenant, s)].join("|") },
      { score: (xt, d) => (nameOf(xt) === nameOf(d) ? (xt.entry ? dayDiff(xt.entry, ymdWib(d.entry_date)!) : 0) : null) },
    ])

    for (const { x: xt, d } of pairs) {
      const fields: FieldDiff[] = []
      const data: Partial<TenantData> = {}
      let room: string | undefined
      const dRoom = d.building?.code ?? ""
      if (xt.room && norm(xt.room) !== norm(dRoom)) {
        if (knownRoom(xt.room)) {
          fields.push({ field: "Kamar", before: dRoom || "—", after: xt.room })
          room = xt.room
        } else issues.push({ sheet: "Daftar Penghuni", row: xt.row, message: `Kode bangunan "${xt.room}" untuk ${xt.name} tidak ada di web maupun sheet Bangunan` })
      }
      // Isian kosong di Excel tidak menghapus data yang sudah diisi di web
      const text = (label: string, field: "nik" | "phone_1" | "phone_2" | "emergency_contact", after: string, isPhone = false) => {
        const before = d[field] ?? ""
        if (blank(after)) return
        const same = isPhone ? digits(after) === digits(before) : norm(after) === norm(before)
        if (!same) {
          fields.push({ field: label, before: blank(before) ? "—" : before, after })
          data[field] = after
        }
      }
      text("NIK", "nik", xt.nik)
      text("No. kontak 1", "phone_1", xt.phone1, true)
      text("No. kontak 2", "phone_2", xt.phone2, true)
      text("No. darurat", "emergency_contact", xt.emergency, true)
      const dEntry = ymdWib(d.entry_date)
      if (xt.entry && xt.entry !== dEntry) {
        fields.push({ field: "Tgl. masuk", before: showDate(dEntry), after: showDate(xt.entry) })
        data.entry_date = xt.entry
      }
      const dExit = ymdWib(d.exit_date)
      if (xt.exit && xt.exit !== dExit) {
        fields.push({ field: "Tgl. keluar", before: showDate(dExit), after: showDate(xt.exit) })
        data.exit_date = xt.exit
      }
      const dActive = d.status === "Active"
      if (xt.active !== dActive) {
        fields.push({ field: "Status", before: dActive ? "Aktif" : "Tidak aktif", after: xt.active ? "Aktif" : "Tidak aktif" })
        data.status = xt.active ? "Active" : "Deactive"
      }
      if (fields.length) {
        add(
          { key: `tenant:upd:${d.id}`, entity: "tenant", kind: "update", title: d.name, subtitle: dRoom || undefined, fields, selectable: true, defaultOn: true, requires: room && newBuildingKey(room) ? [newBuildingKey(room)!] : undefined },
          { entity: "tenant", action: "update", id: d.id, data, room }
        )
      }
    }

    for (const xt of onlyX) {
      const key = `tenant:add:${xt.row}`
      if (!xt.entry) {
        issues.push({ sheet: "Daftar Penghuni", row: xt.row, message: `Penghuni baru ${xt.name} belum punya Tgl. Masuk — tidak bisa ditambahkan` })
        continue
      }
      if (xt.room && !knownRoom(xt.room)) issues.push({ sheet: "Daftar Penghuni", row: xt.row, message: `Kode bangunan "${xt.room}" untuk ${xt.name} tidak dikenal — penghuni ditambahkan tanpa kamar` })
      const room = xt.room && knownRoom(xt.room) ? xt.room : ""
      tenantNewKeys.set(`${norm(xt.name)}|${norm(room)}`, key)
      add(
        {
          key,
          entity: "tenant",
          kind: "add",
          title: xt.name,
          subtitle: [room || "Tanpa kamar", `masuk ${showDate(xt.entry)}`, xt.exit ? `keluar ${showDate(xt.exit)}` : null, xt.active ? "Aktif" : "Tidak aktif"].filter(Boolean).join(" · "),
          selectable: true,
          defaultOn: true,
          requires: room && newBuildingKey(room) ? [newBuildingKey(room)!] : undefined,
        },
        {
          entity: "tenant",
          action: "create",
          data: {
            room,
            name: xt.name,
            nik: blank(xt.nik) ? "0" : xt.nik,
            phone_1: blank(xt.phone1) ? "-" : xt.phone1,
            phone_2: blank(xt.phone2) ? null : xt.phone2,
            emergency_contact: blank(xt.emergency) ? null : xt.emergency,
            entry_date: xt.entry,
            exit_date: xt.exit,
            status: xt.active ? "Active" : "Deactive",
          },
        }
      )
    }
    for (const d of onlyD) {
      add({ key: `tenant:web:${d.id}`, entity: "tenant", kind: "webOnly", title: d.name, subtitle: `${d.building?.code ?? "Tanpa kamar"} · masuk ${showDate(ymdWib(d.entry_date))}`, note: "Tidak ada di Excel — dibiarkan", selectable: false, defaultOn: false })
    }
  }

  // Pembayaran
  if (x.payments) {
    type D = DbData["payments"][number]
    const nameOf = (p: XPayment | D, s: "x" | "d") => norm(s === "x" ? (p as XPayment).name : (p as D).tenant.name)
    const dateOf = (p: XPayment | D, s: "x" | "d") => (s === "x" ? (p as XPayment).date : ymdWib((p as D).transfer_date)!)
    const amountOf = (p: XPayment | D) => money(p.amount)
    const { pairs, onlyX, onlyD } = pairUp<XPayment, D>(x.payments, db.payments, [
      { key: (p, s) => [nameOf(p as XPayment, s), dateOf(p as XPayment, s), amountOf(p as XPayment)].join("|") },
      { key: (p, s) => [nameOf(p as XPayment, s), dateOf(p as XPayment, s)].join("|") },
      { score: (xp, d) => (nameOf(xp, "x") === nameOf(d, "d") && amountOf(xp) === amountOf(d) && dayDiff(xp.date, ymdWib(d.transfer_date)!) <= 7 ? dayDiff(xp.date, ymdWib(d.transfer_date)!) : null) },
    ])
    const month = (ymd: string | null) => ymd?.slice(0, 7) ?? ""
    for (const { x: xp, d } of pairs) {
      const fields: FieldDiff[] = []
      const data: { amount?: number; transfer_date?: string; rent_duration_months?: number; end?: string } = {}
      if (amountOf(d) !== xp.amount) {
        fields.push({ field: "Nominal", before: rupiah(d.amount), after: rupiah(xp.amount) })
        data.amount = xp.amount
      }
      const dDate = ymdWib(d.transfer_date)!
      if (dDate !== xp.date) {
        fields.push({ field: "Tgl. transfer", before: showDate(dDate), after: showDate(xp.date) })
        data.transfer_date = xp.date
      }
      if (d.rent_duration_months !== xp.duration) {
        fields.push({ field: "Masa sewa", before: `${d.rent_duration_months} bln`, after: `${xp.duration} bln` })
        data.rent_duration_months = xp.duration
      }
      // Tanggal akhir sewa di web mengikuti tanggal masuk penghuni, jadi yang dibandingkan bulannya saja
      if (xp.end && month(xp.end) !== month(ymdWib(d.rent_end_date))) {
        fields.push({ field: "Akhir sewa", before: showDate(ymdWib(d.rent_end_date)), after: showDate(xp.end) })
        data.end = xp.end
      }
      if (fields.length) {
        add({ key: `payment:upd:${d.id}`, entity: "payment", kind: "update", title: d.tenant.name, subtitle: `${d.tenant.building?.code ?? ""} · ${showDate(dDate)}`, fields, selectable: true, defaultOn: true }, { entity: "payment", action: "update", id: d.id, data })
      }
    }
    for (const xp of onlyX) {
      const key = `payment:add:${xp.row}`
      const name = norm(xp.name)
      const existing = db.tenants.some((t) => norm(t.name) === name)
      const newTenant = tenantNewKeys.get(`${name}|${norm(xp.room)}`) ?? [...tenantNewKeys].find(([k]) => k.startsWith(`${name}|`))?.[1]
      if (!existing && !newTenant) {
        issues.push({ sheet: "Pembayaran Sewa", row: xp.row, message: `Pembayaran ${xp.name} ${rupiah(xp.amount)} (${showDate(xp.date)}): nama penghuni tidak ditemukan` })
        continue
      }
      add(
        {
          key,
          entity: "payment",
          kind: "add",
          title: xp.name,
          subtitle: `${xp.room || "—"} · ${rupiah(xp.amount)} · ${showDate(xp.date)} · ${xp.duration} bln${xp.end ? ` · s/d ${showDate(xp.end)}` : ""}`,
          selectable: true,
          defaultOn: true,
          requires: !existing && newTenant ? [newTenant] : undefined,
        },
        { entity: "payment", action: "create", data: { name: xp.name, room: xp.room, amount: xp.amount, date: xp.date, duration: xp.duration, end: xp.end } }
      )
    }
    for (const d of onlyD) {
      add(
        { key: `payment:web:${d.id}`, entity: "payment", kind: "webOnly", title: d.tenant.name, subtitle: `${d.tenant.building?.code ?? "—"} · ${rupiah(d.amount)} · ${showDate(ymdWib(d.transfer_date))}`, note: "Centang untuk menghapus dari web", selectable: true, defaultOn: false },
        { entity: "payment", action: "delete", id: d.id }
      )
    }
  }

  // Cash flow
  if (x.cashflows) {
    type D = DbData["cashflows"][number]
    const v = (c: XCashflow | D, s: "x" | "d") => ({
      date: s === "x" ? (c as XCashflow).date : ymdWib((c as D).transaction_date)!,
      type: c.type,
      amount: money(c.amount),
      category: norm(c.category),
      description: norm(c.description),
    })
    const k = (...parts: (keyof ReturnType<typeof v>)[]) => (c: XCashflow | D, s: "x" | "d") => parts.map((p) => v(c, s)[p]).join("|")
    const { pairs, onlyX, onlyD } = pairUp<XCashflow, D>(x.cashflows, db.cashflows, [
      { key: k("date", "type", "amount", "category", "description") },
      // Deskripsi/kategori diperbarui (mis. "-" dilengkapi nama penghuni)
      { key: k("date", "type", "amount", "category") },
      { key: k("date", "type", "amount") },
      // Nominal diperbaiki
      { key: k("date", "type", "category", "description") },
      // Tanggal digeser sedikit, atau dicatat dulu di web lalu masuk Excel dengan tanggal lain
      { score: (xc, d) => (xc.type === d.type && money(xc.amount) === money(d.amount) && dayDiff(xc.date, ymdWib(d.transaction_date)!) <= 7 ? dayDiff(xc.date, ymdWib(d.transaction_date)!) + (norm(xc.category) === norm(d.category) ? 0 : 0.5) : null) },
      // Tipe dibalik (pemasukan ↔ pengeluaran)
      { key: k("date", "amount", "description") },
    ])
    const signed = (type: string, amount: number) => (type === "Pemasukan" ? amount : -amount)
    for (const { x: xc, d } of pairs) {
      const fields: FieldDiff[] = []
      const data: Partial<CashflowData> = {}
      const dDate = ymdWib(d.transaction_date)!
      if (xc.date !== dDate) {
        fields.push({ field: "Tanggal", before: showDate(dDate), after: showDate(xc.date) })
        data.transaction_date = xc.date
      }
      if (xc.type !== d.type) {
        fields.push({ field: "Tipe", before: d.type, after: xc.type })
        data.type = xc.type
      }
      if (norm(xc.category) !== norm(d.category)) {
        fields.push({ field: "Kategori", before: d.category, after: xc.category })
        data.category = xc.category
      }
      if (norm(xc.description) !== norm(d.description)) {
        fields.push({ field: "Deskripsi", before: d.description, after: xc.description })
        data.description = xc.description
      }
      if (money(xc.amount) !== money(d.amount)) {
        fields.push({ field: "Nominal", before: rupiah(d.amount), after: rupiah(xc.amount) })
        data.amount = xc.amount
      }
      if (!fields.length) continue
      add(
        {
          key: `cashflow:upd:${d.id}`,
          entity: "cashflow",
          kind: "update",
          title: xc.description,
          subtitle: `${xc.category} · ${xc.type} ${rupiah(xc.amount)} · ${showDate(xc.date)}`,
          fields,
          note: `Baris ${xc.row} di Excel`,
          selectable: true,
          defaultOn: true,
          saldoDelta: signed(xc.type, xc.amount) - signed(d.type, d.amount),
        },
        { entity: "cashflow", action: "update", id: d.id, data }
      )
    }
    for (const xc of onlyX) {
      add(
        {
          key: `cashflow:add:${xc.row}`,
          entity: "cashflow",
          kind: "add",
          title: xc.description,
          subtitle: `${xc.category} · ${xc.type} ${rupiah(xc.amount)} · ${showDate(xc.date)}`,
          note: `Baris ${xc.row} di Excel`,
          selectable: true,
          defaultOn: true,
          saldoDelta: signed(xc.type, xc.amount),
        },
        { entity: "cashflow", action: "create", data: { type: xc.type, category: xc.category, description: xc.description, amount: xc.amount, transaction_date: xc.date } }
      )
    }
    for (const d of onlyD) {
      add(
        {
          key: `cashflow:web:${d.id}`,
          entity: "cashflow",
          kind: "webOnly",
          title: d.description,
          subtitle: `${d.category} · ${d.type} ${rupiah(d.amount)} · ${showDate(ymdWib(d.transaction_date))}`,
          note: "Centang untuk menghapus dari web",
          selectable: true,
          defaultOn: false,
          saldoDelta: -signed(d.type, d.amount),
        },
        { entity: "cashflow", action: "delete", id: d.id }
      )
    }
  }

  return { changes, ops, issues }
}
