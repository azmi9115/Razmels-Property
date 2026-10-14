import { BarChart3, Building2, CreditCard, LayoutDashboard, ShieldCheck, Users, Wallet, type LucideIcon } from "lucide-react"

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
    ],
  },
  {
    label: "Administrasi",
    ownerOnly: true,
    items: [
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
