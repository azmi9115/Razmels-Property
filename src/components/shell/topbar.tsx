"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { ChevronRight, LogOut, Search } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommandMenu, useCommandMenu } from "@/components/shell/command-menu"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import type { SessionUser } from "@/components/app-sidebar"
import { findNavItem } from "@/lib/nav"
import { initials } from "@/lib/format"

export function Topbar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const current = findNavItem(pathname)
  const command = useCommandMenu()
  const isInvoice = pathname.endsWith("/invoice")

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger className="-ml-1 size-9 text-muted-foreground hover:text-foreground" />
      <div className="h-5 w-px bg-border" />

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Razmel&apos;s</span>
        <ChevronRight className="hidden size-3.5 text-muted-foreground/60 sm:inline" />
        <span className="truncate font-semibold">{current?.title ?? "Dashboard"}</span>
        {isInvoice && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="truncate text-muted-foreground">Kuitansi</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => command.setOpen(true)}
          className="group flex h-9 items-center gap-2 rounded-lg border bg-card px-2.5 text-sm text-muted-foreground shadow-xs transition-colors hover:border-ring/40 hover:text-foreground sm:w-64 sm:px-3"
        >
          <Search className="size-4" />
          <span className="hidden flex-1 truncate text-left whitespace-nowrap sm:inline">Cari menu atau penghuni…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-emerald-950 ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menu akun"
          >
            {initials(user.name)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                <span className="mt-2 inline-flex rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  {user.role === "OWNER" ? "Owner · akses penuh" : "Admin · staf"}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2 text-danger focus:bg-danger-soft focus:text-danger"
            >
              <LogOut className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandMenu role={user.role} open={command.open} onOpenChange={command.setOpen} />
    </header>
  )
}
