import { BarChart3, Briefcase, Building2, CreditCard, FileSpreadsheet, LayoutDashboard, ShieldCheck, Users, ScanSearch, Wallet, type LucideIcon } from "lucide-react"

export type Role = "OWNER" | "ADMIN"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  description: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
  ownerOnly?: boolean
}

export const navGroups: NavGroup[] = [
  {
    label: "Ringkasan",
    ownerOnly: true,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, description: "Ringkasan okupansi, tunggakan, dan keuangan" },
      { title: "Monitoring Sewa", url: "/dashboard/monitoring", icon: BarChart3, description: "Riwayat bayar tiap penghuni per bulan" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { title: "Bangunan & Kamar", url: "/dashboard/buildings", icon: Building2, description: "Data unit, tarif, dan status hunian" },
      { title: "Penghuni", url: "/dashboard/tenants", icon: Users, description: "Data penyewa dan jatuh tempo" },
      { title: "Pembayaran", url: "/dashboard/payments", icon: CreditCard, description: "Catat sewa & verifikasi mutasi" },
    ],
  },
  {
    label: "Keuangan",
    ownerOnly: true,
    items: [
      { title: "Cash Flow", url: "/dashboard/cashflow", icon: Wallet, description: "Buku besar pemasukan & pengeluaran" },
      { title: "Laporan Bisnis", url: "/dashboard/bisnis", icon: Briefcase, description: "Pendapatan sewa & biaya operasional saja" },
      { title: "Transparansi Keuangan", url: "/dashboard/transparansi", icon: ScanSearch, description: "Analisis otomatis, alur laba ke aset & transaksi yang perlu dicek" },
    ],
  },
  {
    label: "Administrasi",
    ownerOnly: true,
    items: [
      { title: "Update dari Excel", url: "/dashboard/update-excel", icon: FileSpreadsheet, description: "Upload Excel manager ops, cek perubahan, lalu verifikasi" },
      { title: "Manajemen Staf", url: "/dashboard/users", icon: ShieldCheck, description: "Akun & hak akses pengguna" },
    ],
  },
]

export function navForRole(role: string | undefined): NavGroup[] {
  return navGroups.filter((g) => !g.ownerOnly || role === "OWNER")
}

export function isNavActive(pathname: string, url: string): boolean {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function findNavItem(pathname: string): NavItem | undefined {
  return navGroups.flatMap((g) => g.items).find((item) => isNavActive(pathname, item.url))
}

// Halaman khusus OWNER (grup ownerOnly di atas) — dipakai proxy.ts supaya staf tidak bisa membuka lewat URL langsung
export function isOwnerOnlyPath(pathname: string): boolean {
  return navGroups.some((g) => g.ownerOnly && g.items.some((item) => isNavActive(pathname, item.url)))
}
