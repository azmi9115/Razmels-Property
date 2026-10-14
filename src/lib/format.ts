// Format angka & tanggal yang dipakai di seluruh aplikasi.
// Selalu lewat helper ini supaya tampilan konsisten (tanpa desimal, bulan Indonesia).

const rupiahFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })

export function formatRupiah(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? "-" : ""
  return `${sign}Rp ${rupiahFormatter.format(Math.abs(rounded))}`
}

// Versi ringkas untuk sumbu grafik & kartu kecil: Rp 750 rb, Rp 12,9 jt, Rp 1,2 M
export function formatRupiahCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 })
  if (abs >= 1_000_000_000) return `${sign}Rp ${fmt(abs / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `${sign}Rp ${fmt(abs / 1_000_000)} jt`
  if (abs >= 1_000) return `${sign}Rp ${fmt(abs / 1_000)} rb`
  return `${sign}Rp ${fmt(abs)}`
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`
}

type DateInput = Date | string | number

// "1 Jun 2026"
export function formatDate(date: DateInput): string {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

// "1 Juni 2026"
export function formatDateLong(date: DateInput): string {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

// "Kamis, 8 Oktober 2026"
export function formatDateFull(date: DateInput): string {
  return new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

// "Jun 26" — label bulan untuk grafik & tabel monitoring
export function formatMonthShort(year: number, month: number): string {
  return `${MONTHS_SHORT[month]} ${String(year).slice(-2)}`
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Nilai kosong hasil impor Excel (NIK "0", telepon "-") dianggap belum diisi
export function isBlank(value: string | null | undefined): boolean {
  if (!value) return true
  const v = value.trim()
  return v === "" || v === "0" || v === "-" || v === "–"
}

// Nomor HP Indonesia → link WhatsApp, atau null kalau nomornya tidak valid
export function whatsappLink(phone: string | null | undefined, message?: string): string | null {
  if (isBlank(phone)) return null
  let digits = phone!.replace(/\D/g, "")
  if (digits.startsWith("0")) digits = "62" + digits.slice(1)
  else if (digits.startsWith("8")) digits = "62" + digits
  if (!digits.startsWith("62") || digits.length < 10) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${digits}${text}`
}
