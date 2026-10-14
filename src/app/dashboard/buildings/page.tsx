import { BedDouble, Building2, DoorOpen, Hotel, Store, Wallet } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddBuildingDialog } from "@/components/add-building-dialog"
import { BuildingActions } from "@/components/building-actions"
import { SearchBar } from "@/components/search-bar"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { formatRupiah, formatRupiahCompact, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import { unitGroupKey } from "@/lib/building-types"

export const dynamic = 'force-dynamic';

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Kamar: BedDouble,
  Kios: Store,
  Apartemen: Hotel,
}

export default async function BuildingsPage(props: { searchParams?: Promise<{ query?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";

  const buildings = await prisma.building.findMany({
    include: {
      tenants: {
        where: { status: "Active" }
      }
    },
    where: query ? {
      OR: [
        { code: { contains: query } },
        { type: { contains: query } }
      ]
    } : {},
    orderBy: { code: 'asc' }
  });

  const occupied = buildings.filter((b) => b.tenants.length > 0)
  const vacant = buildings.length - occupied.length
  const monthlyPotential = buildings.reduce((acc, b) => acc + b.rent_price, 0)
  const monthlyActual = occupied.reduce((acc, b) => acc + b.rent_price, 0)

  // Kelompokkan per blok berdasarkan prefix kode ("BA-1" → "BA"); apartemen jadi satu grup sendiri
  const blocks = new Map<string, typeof buildings>()
  buildings.forEach((b) => {
    const key = unitGroupKey(b)
    blocks.set(key, [...(blocks.get(key) ?? []), b])
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        eyebrow="Operasional"
        title="Bangunan & Kamar"
        description="Semua unit yang Anda kelola, dikelompokkan per blok dan apartemen."
        actions={
          <>
            <SearchBar placeholder="Cari kode atau tipe…" />
            <AddBuildingDialog />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total unit"
          icon={Building2}
          tone="info"
          value={buildings.length}
          hint={blocks.has("Apartemen") ? `${blocks.size - 1} blok + ${blocks.get("Apartemen")!.length} apartemen` : `${blocks.size} blok`}
        />
        <StatCard label="Terisi" icon={DoorOpen} tone="success" value={occupied.length} hint={`${buildings.length > 0 ? Math.round((occupied.length / buildings.length) * 100) : 0}% okupansi`} />
        <StatCard label="Tersedia" icon={BedDouble} tone={vacant > 0 ? "warning" : "neutral"} value={vacant} hint={vacant > 0 ? "Siap disewakan" : "Semua unit terisi"} />
        <StatCard label="Sewa bulanan" icon={Wallet} tone="success" value={formatRupiahCompact(monthlyActual)} hint={`dari potensi ${formatRupiahCompact(monthlyPotential)}`} />
      </div>

      {buildings.length === 0 ? (
        <section className="surface">
          <EmptyState icon={Building2} title="Belum ada unit" description={query ? `Tidak ada unit yang cocok dengan “${query}”.` : "Tambahkan kamar atau kios pertama Anda."} />
        </section>
      ) : (
        Array.from(blocks).map(([block, list]) => {
          const filled = list.filter((b) => b.tenants.length > 0).length
          return (
            <section key={block} className="space-y-3">
              <div className="flex items-center gap-3">
                {block === "Apartemen" ? (
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-navy text-emerald-300">
                    <Hotel className="size-4" />
                  </span>
                ) : (
                  <span className="flex h-8 min-w-11 items-center justify-center rounded-lg bg-brand-navy px-2.5 font-mono text-[13px] font-bold text-emerald-300">
                    {block}
                  </span>
                )}
                <h2 className="text-sm font-semibold">{block === "Apartemen" ? "Apartemen" : `Blok ${block}`}</h2>
                <span className="text-[13px] text-muted-foreground">
                  {filled}/{list.length} terisi
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {list.map((building) => {
                  const tenant = building.tenants[0]
                  const isOccupied = !!tenant
                  const Icon = typeIcon[building.type] ?? Building2
                  return (
                    <article
                      key={building.id}
                      className={cn(
                        "surface group relative flex flex-col gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                        !isOccupied && "ring-1 ring-emerald-500/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className={cn("flex size-11 items-center justify-center rounded-xl", isOccupied ? "bg-muted text-muted-foreground" : "bg-success-soft text-success")}>
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className={cn("leading-tight font-bold", building.type === "Apartemen" ? "text-base" : "font-mono text-lg")}>{building.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {building.type} · {building.rent_period}
                            </p>
                          </div>
                        </div>
                        <BuildingActions building={building} isOccupied={isOccupied} />
                      </div>

                      {building.description && <p className="-mt-1 text-[13px] leading-snug text-muted-foreground">{building.description}</p>}

                      <p className="text-[13px] text-muted-foreground">
                        <span className="text-lg font-bold tracking-tight text-foreground">{formatRupiah(building.rent_price)}</span>
                        {building.rent_period === "Tahunan" ? " /tahun" : " /bulan"}
                      </p>

                      <div className="mt-auto border-t pt-3">
                        {isOccupied ? (
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-info-soft text-[10px] font-bold text-info">{initials(tenant.name)}</span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{tenant.name}</span>
                            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Terisi</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-success">
                            <span className="relative flex size-2">
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
                              <span className="relative inline-flex size-2 rounded-full bg-success" />
                            </span>
                            Tersedia untuk disewa
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
