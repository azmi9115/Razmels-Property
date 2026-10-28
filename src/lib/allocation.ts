// "Ke mana uangnya": kelompokkan transaksi di luar bisnis (pribadi, investasi, titipan) supaya
// selisih antara laba bisnis dan total aset bisa ditelusuri, plus deteksi kemungkinan salah catat.
import { classifyCashflow } from "@/lib/business"

type Cf = { id: string; type: string; category: string; description: string; amount: number; transaction_date: Date }

export const INVESTMENT_GROUP = "Dipindah ke investasi (SBR/ORI)"

const OUT_GROUPS: { label: string; test: (d: string, cf: Cf) => boolean }[] = [
  { label: INVESTMENT_GROUP, test: (d) => /sbr|ori\d|sukuk|obligasi|reksa ?dana|deposito/.test(d) },
  { label: "Sedekah", test: (_, cf) => cf.category === "Sedekah" },
  { label: "Zakat", test: (d, cf) => cf.category === "Zakat" || d.includes("zakat") },
  { label: "Wakaf", test: (_, cf) => cf.category === "Wakaf" },
  { label: "Biaya & pajak bank", test: (d, cf) => cf.category === "Bank" || d === "notifikasi" },
  { label: "Titipan & pinjaman (Wedi)", test: (d) => d.includes("wedi") },
  { label: "Kesehatan", test: (d) => /berobat|obat|mri|dokter|rumah sakit|\brs\b|telinga|kacamata|periksa|\blab\b|apotek|terapi/.test(d) },
  { label: "Pendidikan", test: (d) => /sekolah|pendidikan|kuliah|spp|\bles\b/.test(d) },
  { label: "Mobil", test: (d) => /livina|innova|mobil|bensin|bbm|\btol\b|\boli\b|\bban\b|\baki\b/.test(d) },
  { label: "Pajak & PBB rumah", test: (d) => /\bpbb\b|pajak/.test(d) },
  { label: "Liburan & perjalanan", test: (d) => /ciater|tiket|hotel|liburan|wisata|pesawat|kereta/.test(d) },
  { label: "THR & hadiah keluarga", test: (d) => /thr|cucu|hadiah|kado|angpao|ultah/.test(d) },
  { label: "Tagihan rumah (listrik, air, internet)", test: (d) => /pln|pam|listrik|\bair\b|internet|wifi|indihome|pulsa|token|modem/.test(d) },
  { label: "Barang & perbaikan rumah", test: (d) => /\bac\b|purifier|kulkas|mesin|kasur|lemari|\btv\b|kipas|perabot|renov|tukang|semen|bangunan|\bcat\b/.test(d) },
  { label: "Gaji pekerja", test: (d) => /gaji/.test(d) },
  { label: "Transfer ke keluarga", test: (d) => /ayah minta|ibu minta|transfer ke|kirim/.test(d) },
]

const IN_GROUPS: { label: string; test: (d: string, cf: Cf) => boolean }[] = [
  { label: "Kupon & bunga investasi", test: (_, cf) => cf.category === "Bank" },
  { label: "Titipan & pinjaman (Wedi)", test: (d) => d.includes("wedi") },
  { label: "Dana dari keluarga", test: (d) => /transfer ibu|dari ibu|transfer ayah|dari ayah/.test(d) },
]

// Pilihan kelompok untuk fitur "ajari sistem"
export const GROUP_OPTIONS: Record<string, string[]> = {
  Pemasukan: [...new Set(IN_GROUPS.map((g) => g.label)), "Pemasukan lain"],
  Pengeluaran: [...new Set(OUT_GROUPS.map((g) => g.label)), "Lain-lain"],
}

// Ajaran pemilik (tabel GroupRule): deskripsi mengandung keyword → kelompok
export type TaughtRule = { type: string; keyword: string; group: string }

// Kelompok untuk transaksi non-bisnis (termasuk yang dikecualikan dari kategori usaha). null = transaksi bisnis.
// Ajaran pemilik dicek lebih dulu (keyword terpanjang menang), baru aturan bawaan.
export function allocationGroup(cf: Cf, taught: TaughtRule[] = []): string | null {
  if (classifyCashflow(cf).kind === "business") return null
  const d = cf.description.trim().toLowerCase()
  const learned = taught
    .filter((r) => r.type === cf.type && r.keyword !== "" && d.includes(r.keyword))
    .sort((a, b) => b.keyword.length - a.keyword.length)[0]
  if (learned) return learned.group
  const groups = cf.type === "Pemasukan" ? IN_GROUPS : OUT_GROUPS
  return groups.find((g) => g.test(d, cf))?.label ?? (cf.type === "Pemasukan" ? "Pemasukan lain" : "Lain-lain")
}

// ── Deteksi kemungkinan salah catat ──
// Tiap temuan punya tingkat keyakinan. Temuan yang sudah ditandai "Sudah benar" oleh pemilik
// disimpan di tabel CashflowReview dan tidak ditampilkan lagi.
export type Severity = "tinggi" | "sedang" | "rendah"
export type Anomaly = { cf: Cf; rule: string; hint: string; severity: Severity }

export const ANOMALY_RULES = {
  incomeLooksExpense: "Pemasukan, tapi deskripsinya seperti pengeluaran",
  expenseLooksIncome: "Pengeluaran, tapi deskripsinya seperti pemasukan",
  rentInPersonal: "Sewa penghuni tercatat di kategori pribadi",
  bizInPersonal: "Kemungkinan biaya bisnis di kategori pribadi",
  personalInBiz: "Kemungkinan transaksi pribadi di kategori bisnis",
  wrongApartment: "Kategori apartemen tertukar",
  duplicate: "Kemungkinan input dobel",
  unusualAmount: "Nominal jauh di atas biasanya",
  futureDate: "Tanggal di masa depan",
  blankBig: "Nominal besar tanpa keterangan",
} as const

export const ANOMALY_SHORT: Record<string, string> = {
  [ANOMALY_RULES.incomeLooksExpense]: "Harusnya pengeluaran?",
  [ANOMALY_RULES.expenseLooksIncome]: "Harusnya pemasukan?",
  [ANOMALY_RULES.rentInPersonal]: "Sewa di kategori pribadi",
  [ANOMALY_RULES.bizInPersonal]: "Bisnis di kategori pribadi",
  [ANOMALY_RULES.personalInBiz]: "Pribadi di kategori bisnis",
  [ANOMALY_RULES.wrongApartment]: "Apartemen tertukar",
  [ANOMALY_RULES.duplicate]: "Input dobel",
  [ANOMALY_RULES.unusualAmount]: "Nominal tidak biasa",
  [ANOMALY_RULES.futureDate]: "Tanggal masa depan",
  [ANOMALY_RULES.blankBig]: "Tanpa keterangan",
}

const DAY = 864e5
const UNIT_CODE = /\b(ba|bb|da|db)[ _-]?\d\b/
const EXPENSE_WORDS = /\b(bayar|beli|pln|pam|ipl|gaji|berobat|tiket|pajak|cicilan|biaya|sedekah|zakat|wakaf|tagihan)\b/
const INCOME_WORDS = /\b(sewa dari|pembayaran sewa|kupon|bunga|terima|diterima)\b/
const BIZ_WORDS = /kontrakan|kosan|\bkos\b|kios|\bapt\b|apartemen|penghuni|pule|razmel|sky terrace|taman melati/
const PERSONAL_WORDS = /berobat|sedekah|zakat|wakaf|thr cucu|liburan|tiket/
const MONTH_WORDS = /\b(jan|feb|mar|apr|mei|may|jun|jul|agu|aug|sep|okt|oct|nov|des|dec)[a-z]*\b/g

// Deskripsi kosong/pengisi. Kata pendek yang bermakna (PLN, PAM, IPL) BUKAN pengisi
const isPlaceholder = (d: string) => d === "" || /^(-+|x+|tba|\?+|\.+)$/.test(d)
// Kunci "jenis transaksi" untuk membandingkan nominal: tipe + kategori + 2 kata pertama (tanpa angka & nama bulan)
const habitKey = (cf: Cf, d: string) =>
  `${cf.type}|${cf.category}|${d.replace(MONTH_WORDS, "").replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ")}`

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

export function detectAnomalies(cashflows: Cf[], today = new Date()): Anomaly[] {
  const out: Anomaly[] = []
  const add = (cf: Cf, rule: string, severity: Severity, hint: string) => out.push({ cf, rule, severity, hint })

  // Transaksi yang punya pasangan berlawanan (nominal sama, ≤ 3 hari) dianggap titipan/pindah dana, bukan salah catat
  const hasMirror = (cf: Cf) =>
    cashflows.some((o) => o.id !== cf.id && o.type !== cf.type && Math.abs(o.amount - cf.amount) < 1 && Math.abs(+o.transaction_date - +cf.transaction_date) <= 3 * DAY)

  // Pola nominal per jenis transaksi (untuk deteksi nominal tidak biasa)
  const habits = new Map<string, number[]>()
  for (const cf of cashflows) {
    const d = cf.description.trim().toLowerCase()
    if (isPlaceholder(d)) continue
    const k = habitKey(cf, d)
    habits.set(k, [...(habits.get(k) ?? []), cf.amount])
  }

  const seen = new Map<string, Cf>()
  for (const cf of [...cashflows].sort((a, b) => +a.transaction_date - +b.transaction_date)) {
    const d = cf.description.trim().toLowerCase()
    const cls = classifyCashflow(cf)
    const biz = cls.kind !== "personal"
    const income = cf.type === "Pemasukan"
    const placeholder = isPlaceholder(d)

    if (cf.transaction_date > today) add(cf, ANOMALY_RULES.futureDate, "tinggi", "Kemungkinan salah ketik tahun atau bulan.")

    if (income && EXPENSE_WORDS.test(d) && !hasMirror(cf)) {
      add(cf, ANOMALY_RULES.incomeLooksExpense, "tinggi", "Cek apakah tipenya harusnya Pengeluaran.")
    } else if (!income && (INCOME_WORDS.test(d) || (cf.category === "Kontrakan" && /\((ba|bb|da|db)-\d\)/.test(d))) && !hasMirror(cf)) {
      add(cf, ANOMALY_RULES.expenseLooksIncome, "tinggi", "Cek apakah tipenya harusnya Pemasukan.")
    }

    if (!biz && income && UNIT_CODE.test(d)) {
      add(cf, ANOMALY_RULES.rentInPersonal, "tinggi", "Pindahkan ke kategori Kontrakan supaya masuk laporan bisnis.")
    } else if (!biz && (UNIT_CODE.test(d) || BIZ_WORDS.test(d))) {
      add(cf, ANOMALY_RULES.bizInPersonal, "sedang", "Kalau ini untuk kontrakan/apartemen, pindahkan ke kategori bisnisnya.")
    } else if (biz && !income && PERSONAL_WORDS.test(d)) {
      add(cf, ANOMALY_RULES.personalInBiz, "sedang", "Kalau ini keperluan pribadi, pindahkan ke kategori pribadi.")
    }

    if ((cf.category === "Apt DM" && /depok|taman melati/.test(d)) || (cf.category === "Apt Depok" && /\bdm\b|daan mogot|sky terrace/.test(d))) {
      add(cf, ANOMALY_RULES.wrongApartment, "tinggi", "Deskripsi menyebut apartemen yang lain.")
    }

    if (placeholder && cf.amount >= 1_000_000) {
      add(cf, ANOMALY_RULES.blankBig, "rendah", "Lengkapi keterangannya supaya bisa dianalisis.")
    }

    if (!placeholder) {
      const xs = habits.get(habitKey(cf, d)) ?? []
      if (xs.length >= 4) {
        const m = median(xs)
        // Kelebihan satu angka nol = ~10×; ambang 8× supaya biaya yang wajar bervariasi (berobat dll.) tidak ikut
        if (cf.amount >= m * 8 && cf.amount - m >= 1_000_000) {
          add(cf, ANOMALY_RULES.unusualAmount, "sedang", `Biasanya sekitar Rp ${Math.round(m).toLocaleString("id-ID")} (${Math.round(cf.amount / m)}× lipat) — cek apakah kelebihan angka nol.`)
        }
      }
    }

    // Deskripsi kosong ("-", "XXX", "TBA") tidak bisa dibedakan antar penghuni, jadi tidak dianggap dobel
    if (cf.amount >= 10000 && !placeholder) {
      const key = `${cf.type}|${cf.category}|${Math.round(cf.amount)}|${d}`
      const prev = seen.get(key)
      if (prev && +cf.transaction_date - +prev.transaction_date <= 3 * DAY) {
        const sameDay = prev.transaction_date.toDateString() === cf.transaction_date.toDateString()
        add(cf, ANOMALY_RULES.duplicate, sameDay ? "tinggi" : "rendah", `Sama persis dengan transaksi ${prev.transaction_date.toLocaleDateString("id-ID")}.`)
      }
      seen.set(key, cf)
    }
  }

  const rank: Record<Severity, number> = { tinggi: 0, sedang: 1, rendah: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || +b.cf.transaction_date - +a.cf.transaction_date)
}
