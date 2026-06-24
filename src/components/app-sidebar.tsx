"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Building, CreditCard, LayoutDashboard, Users, Wallet, LogOut, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

const ownerItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Bangunan & Kamar", url: "/dashboard/buildings", icon: Building },
  { title: "Daftar Penghuni", url: "/dashboard/tenants", icon: Users },
  { title: "Pembayaran Sewa", url: "/dashboard/payments", icon: CreditCard },
  { title: "Monitoring Sewa", url: "/dashboard/monitoring", icon: BarChart3 },
  { title: "Cash Flow", url: "/dashboard/cashflow", icon: Wallet },
]

const adminItems = [
  { title: "Bangunan & Kamar", url: "/dashboard/buildings", icon: Building },
  { title: "Daftar Penghuni", url: "/dashboard/tenants", icon: Users },
  { title: "Pembayaran Sewa", url: "/dashboard/payments", icon: CreditCard },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const role = (session?.user as any)?.role
  const isOwner = role === "OWNER"
  const items = isOwner ? ownerItems : adminItems

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-primary tracking-tight">Razmel's Property</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mt-4">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = pathname === item.url || (pathname.startsWith(`${item.url}/`) && item.url !== "/dashboard")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />} isActive={isActive} className="transition-all hover:bg-slate-100">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Owner-only section */}
        {isOwner && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Administrasi</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/dashboard/users" />}
                    isActive={pathname === "/dashboard/users" || pathname.startsWith("/dashboard/users/")}
                    className="transition-all hover:bg-slate-100"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Manajemen Staf</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      {session && (
        <div className="p-4 border-t mt-auto space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
              {session.user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">{session.user?.name}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Owner" : "Admin"}
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar (Logout)
          </Button>
        </div>
      )}
    </Sidebar>
  )
}
