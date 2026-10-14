import Link from "next/link"
import { FileText, MessageCircle, Phone, Users } from "lucide-react"
import prisma from "@/lib/prisma"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddTenantDialog } from "@/components/add-tenant-dialog"
import { TenantActions } from "@/components/tenant-actions"
import { SearchBar } from "@/components/search-bar"
import { PaginationControls } from "@/components/pagination-controls"
import { PageHeader } from "@/components/page-header"
import { StatusPill, type Tone } from "@/components/status-pill"
import { EmptyState } from "@/components/empty-state"
import { dueLabel, getDueInfo, startOfToday, type DueInfo } from "@/lib/rent"
import { formatDate, initials, isBlank, whatsappLink } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "late", label: "Telat bayar" },
  { key: "soon", label: "Jatuh tempo ≤ 7 hari" },
  { key: "active", label: "Aktif" },
  { key: "inactive", label: "Sudah keluar" },
] as const

type FilterKey = (typeof FILTERS)[number]["key"]

const dueTone: Record<DueInfo["state"], Tone> = {
  late: "danger",
  soon: "warning",
  ok: "success",
  inactive: "neutral",
}

export default async function TenantsPage(props: { searchParams?: Promise<{ query?: string, page?: string, filter?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const filter = (FILTERS.find((f) => f.key === searchParams?.filter)?.key ?? "all") as FilterKey
  const limit = 15;

  const tenants = await prisma.tenant.findMany({
    include: {
      building: true,
      payments: {
        orderBy: { rent_end_date: "desc" },
        take: 1
      }
    },
    where: query ? {
      OR: [
        { name: { contains: query } },
        { nik: { contains: query } },
        { building: { code: { contains: query } } }
      ]
    } : {}
  });

  const today = startOfToday()
  const rows = tenants.map((tenant) => ({ tenant, due: getDueInfo(tenant, today) }))

  rows.sort((a, b) => {
    // 1. Status Aktif di atas
    if (a.tenant.status !== b.tenant.status) {
      return a.tenant.status === "Active" ? -1 : 1;
    }

    // 2. Jika sama-sama Aktif, yang masa sewanya masih ada di atas yang sudah habis/telat,
    //    lalu urutkan berdasarkan yang paling mendesak
    if (a.tenant.status === "Active") {
      const aActiveRent = a.due.diffDays >= 0;
      const bActiveRent = b.due.diffDays >= 0;
      if (aActiveRent && !bActiveRent) return -1;
      if (!aActiveRent && bActiveRent) return 1;
      return a.due.diffDays - b.due.diffDays;
    }

    // 3. Jika sama-sama Non Aktif, urutkan berdasarkan yang terbaru masuk
    return new Date(b.tenant.entry_date).getTime() - new Date(a.tenant.entry_date).getTime();
  });

  const counts: Record<FilterKey, number> = {
    all: rows.length,
    late: rows.filter((r) => r.due.state === "late").length,
    soon: rows.filter((r) => r.due.state === "soon").length,
    active: rows.filter((r) => r.tenant.status === "Active").length,
    inactive: rows.filter((r) => r.tenant.status !== "Active").length,
  }

  const filtered = rows.filter((r) => {
    if (filter === "late") return r.due.state === "late"
    if (filter === "soon") return r.due.state === "soon"
    if (filter === "active") return r.tenant.status === "Active"
    if (filter === "inactive") return r.tenant.status !== "Active"
    return true
  })

  const availableBuildings = await prisma.building.findMany({
    where: {
      tenants: {
        none: { status: "Active" }
      }
    }
  });

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);

  const filterHref = (key: FilterKey) => {
    const params = new URLSearchParams()
    if (query) params.set("query", query)
    if (key !== "all") params.set("filter", key)
    const qs = params.toString()
    return `/dashboard/tenants${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Operasional"
        title="Penghuni"
        description="Data penyewa aktif maupun yang sudah keluar, diurutkan dari yang paling mendesak."
        actions={
          <>
            <SearchBar placeholder="Cari nama, NIK, atau kamar…" />
            <AddTenantDialog availableBuildings={availableBuildings} />
          </>
        }
      />

      <div className="thin-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = f.key === filter
          const alert = (f.key === "late" || f.key === "soon") && counts[f.key] > 0
          return (
            <Link
              key={f.key}
              href={filterHref(f.key)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                active ? "border-transparent bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-background/20" : alert ? (f.key === "late" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning") : "bg-muted"
                )}
              >
                {counts[f.key]}
              </span>
            </Link>
          )
        })}
      </div>

      <section className="surface overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState icon={Users} title="Tidak ada penghuni" description={query ? `Tidak ada hasil untuk “${query}”.` : "Belum ada data pada filter ini."} />
        ) : (
          <>
            {/* Desktop: tabel */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="hidden xl:table-cell">Masuk</TableHead>
                    <TableHead>Jatuh tempo</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(({ tenant, due }) => {
                    const wa = whatsappLink(tenant.phone_1)
                    return (
                      <TableRow key={tenant.id} className={cn(tenant.status !== "Active" && "opacity-60")}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={tenant.name} tone={dueTone[due.state]} />
                            <div className="min-w-0">
                              <p className="font-semibold">{tenant.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {isBlank(tenant.nik) ? <span className="font-sans italic">NIK belum diisi</span> : `NIK ${tenant.nik}`}
                              </p>
                              {tenant.id_card_url && (
                                <a href={tenant.id_card_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                  <FileText className="size-3.5" /> Lihat KTP
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.building ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[13px] font-semibold">{tenant.building.code}</span>
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{tenant.building.type}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isBlank(tenant.phone_1) ? (
                            <span className="text-xs text-muted-foreground italic">Belum diisi</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5 text-[13px]">
                                <Phone className="size-3.5 text-muted-foreground" />
                                {tenant.phone_1}
                              </span>
                              {wa && (
                                <a href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${tenant.name}`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-success-soft hover:text-success">
                                  <MessageCircle className="size-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-[13px] text-muted-foreground tabular-nums xl:table-cell">{formatDate(tenant.entry_date)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[13px] font-medium tabular-nums">{formatDate(due.dueDate)}</span>
                            <StatusPill tone={dueTone[due.state]} dot>{dueLabel(due)}</StatusPill>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TenantActions tenant={tenant} availableBuildings={availableBuildings} isActive={tenant.status === "Active"} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: kartu */}
            <ul className="divide-y md:hidden">
              {paginated.map(({ tenant, due }) => {
                const wa = whatsappLink(tenant.phone_1)
                return (
                  <li key={tenant.id} className={cn("flex gap-3 p-4", tenant.status !== "Active" && "opacity-60")}>
                    <Avatar name={tenant.name} tone={dueTone[due.state]} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono font-semibold text-foreground">{tenant.building?.code ?? "—"}</span>
                            {tenant.building && ` · ${tenant.building.type}`} · masuk {formatDate(tenant.entry_date)}
                          </p>
                        </div>
                        <TenantActions tenant={tenant} availableBuildings={availableBuildings} isActive={tenant.status === "Active"} />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <StatusPill tone={dueTone[due.state]} dot>{dueLabel(due)}</StatusPill>
                        <span className="text-xs text-muted-foreground tabular-nums">Tempo {formatDate(due.dueDate)}</span>
                        {wa && (
                          <a href={wa} target="_blank" rel="noreferrer" className="ml-auto inline-flex h-7 items-center gap-1 rounded-full bg-success-soft px-2.5 text-xs font-semibold text-success">
                            <MessageCircle className="size-3.5" /> WA
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <PaginationControls totalPages={totalPages} currentPage={currentPage} />
      </section>
    </div>
  )
}

function Avatar({ name, tone }: { name: string; tone: Tone }) {
  const cls: Record<Tone, string> = {
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
    neutral: "bg-muted text-muted-foreground",
  }
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold", cls[tone])}>
      {initials(name)}
    </span>
  )
}
