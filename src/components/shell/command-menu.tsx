"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownLeft, CreditCard, Search, Users } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { navForRole } from "@/lib/nav"
import { cn } from "@/lib/utils"

export function useCommandMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return { open, setOpen }
}

type Command = {
  id: string
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

export function CommandMenu({
  role,
  open,
  onOpenChange,
}: {
  role: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)

  const commands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase()
    const pages: Command[] = navForRole(role)
      .flatMap((g) => g.items)
      .filter((item) => !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
      .map((item) => ({ id: item.url, label: item.title, hint: item.description, icon: item.icon, href: item.url }))

    if (!q) return pages

    const searches: Command[] = [
      {
        id: "search-tenant",
        label: `Cari penghuni “${query.trim()}”`,
        hint: "Nama, NIK, atau kode kamar",
        icon: Users,
        href: `/dashboard/tenants?query=${encodeURIComponent(query.trim())}`,
      },
      {
        id: "search-payment",
        label: `Cari pembayaran “${query.trim()}”`,
        hint: "Nama penghuni, kamar, atau tanggal",
        icon: CreditCard,
        href: `/dashboard/payments?query=${encodeURIComponent(query.trim())}`,
      },
    ]
    return [...searches, ...pages]
  }, [query, role])

  const go = (cmd: Command | undefined) => {
    if (!cmd) return
    onOpenChange(false)
    setQuery("")
    router.push(cmd.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, commands.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      go(commands[active])
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setQuery("")
      }}
    >
      <DialogContent showCloseButton={false} className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Cari cepat</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Ketik nama penghuni, kamar, atau menu…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </div>
        <ul className="thin-scrollbar max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {commands.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-muted-foreground">Tidak ada menu yang cocok.</li>
          )}
          {commands.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(cmd)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  i === active ? "bg-accent text-accent-foreground" : "text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md border bg-card",
                    i === active && "border-transparent bg-primary text-primary-foreground"
                  )}
                >
                  <cmd.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{cmd.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{cmd.hint}</span>
                </span>
                {i === active && <CornerDownLeft className="size-4 opacity-60" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ pilih</span>
          <span>Enter buka</span>
          <span className="ml-auto">Ctrl K untuk membuka kapan saja</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
