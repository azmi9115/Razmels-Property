"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { BrandMark, BrandWordmark } from "@/components/brand"
import { isNavActive, navForRole } from "@/lib/nav"
import { initials } from "@/lib/format"

export type SessionUser = {
  name: string
  email: string
  role: string
}

// Role dikirim dari server (layout), jadi menu langsung lengkap tanpa "lompat" saat sesi dimuat
export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const groups = navForRole(user.role)
  const isOwner = user.role === "OWNER"

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link
          href={isOwner ? "/dashboard" : "/dashboard/tenants"}
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-3 rounded-xl px-1 py-1 text-white outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <BrandMark className="size-9 bg-white/5" />
          <BrandWordmark className="group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 pt-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            <SidebarGroupLabel className="h-7 px-3 text-[10.5px] font-semibold tracking-[0.12em] text-sidebar-foreground/50 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.url)
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link href={item.url} onClick={() => setOpenMobile(false)} />}
                        isActive={active}
                        tooltip={item.title}
                        className="relative h-10 gap-3 rounded-lg px-3 text-[13.5px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white data-active:bg-gradient-to-r data-active:from-emerald-400/15 data-active:to-emerald-400/0 data-active:text-white [&_svg]:size-[18px]"
                      >
                        {active && (
                          <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-sidebar-primary shadow-[0_0_12px_var(--sidebar-primary)] group-data-[collapsible=icon]:hidden" />
                        )}
                        <item.icon className={active ? "text-sidebar-primary" : "opacity-80"} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-white/[0.03] p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-emerald-950">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">{isOwner ? "Owner" : "Admin"}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Keluar"
            aria-label="Keluar"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-red-500/15 hover:text-red-300 group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
