import Link from "next/link"
import { ArrowRight, CalendarCheck2, MessageCircle, ReceiptText, Store, BedDouble, Tag, LogIn, Hotel, MapPin } from "lucide-react"
import prisma from "@/lib/prisma"
import { BrandMark, BrandWordmark } from "@/components/brand"
import { formatRupiah, whatsappLink } from "@/lib/format"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"
import { isStandaloneUnit } from "@/lib/building-types"

export const dynamic = "force-dynamic"

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Kamar: BedDouble,
  Kios: Store,
  Apartemen: Hotel,
}

export default async function LandingPage() {
  // Hanya data publik: kode unit, tipe, tarif, dan terisi/tidaknya. Tidak ada data penghuni.
  const buildings = await prisma.building.findMany({
    select: { code: true, type: true, rent_price: true, rent_period: true, description: true, tenants: { where: { status: "Active" }, select: { id: true } } },
    orderBy: { code: "asc" },
  })

  const units = buildings.map((b) => ({ code: b.code, type: b.type, price: b.rent_price, period: b.rent_period, description: b.description, occupied: b.tenants.length > 0 }))
  const available = units.filter((u) => !u.occupied).length

  // Apartemen tampil di bagian sendiri; peta unit hanya untuk unit berblok (kamar & kios)
  const apartments = units.filter((u) => isStandaloneUnit(u.type))
  const blockUnits = units.filter((u) => !isStandaloneUnit(u.type))
  const blockAvailable = blockUnits.filter((u) => !u.occupied).length

  // Kelompokkan per blok (prefix kode: "BA-1" → "BA")
  const blocks = new Map<string, typeof units>()
  blockUnits.forEach((u) => {
    const key = u.code.split("-")[0] || u.code
    blocks.set(key, [...(blocks.get(key) ?? []), u])
  })

  const types = Array.from(new Set(blockUnits.map((u) => u.type))).map((type) => {
    const list = blockUnits.filter((u) => u.type === type)
    return {
      type,
      total: list.length,
      available: list.filter((u) => !u.occupied).length,
      minPrice: Math.min(...list.map((u) => u.price)),
      period: list[0]?.period ?? "Bulanan",
    }
  })

  const wa = whatsappLink(siteConfig.whatsapp, "Halo Razmel's Property, saya ingin menanyakan ketersediaan unit.")

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-brand-ink text-white">
      {/* Latar: grid + cahaya brand */}
      <div className="grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] -right-40 h-[420px] w-[520px] rounded-full bg-indigo-500/15 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <BrandWordmark subtitle="Kamar, Kios & Apartemen" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#unit" className="transition-colors hover:text-white">Kamar & kios</a>
          {apartments.length > 0 && <a href="#apartemen" className="transition-colors hover:text-white">Apartemen</a>}
          <a href="#keunggulan" className="transition-colors hover:text-white">Keunggulan</a>
        </nav>
        <Link
          href="/login"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15"
        >
          <LogIn className="size-4" />
          Masuk staf
        </Link>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              {available > 0 ? `${available} unit tersedia saat ini` : "Semua unit sedang terisi"}
            </span>
            <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Hunian & tempat usaha,{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">dikelola dengan rapi.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
              Razmel&apos;s Property menyewakan kamar, kios, dan apartemen dengan tarif bulanan yang jelas. Setiap pembayaran tercatat dan punya kuitansi digital.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-bold text-emerald-950 shadow-[0_10px_40px_-10px_rgb(52_211_153/0.7)] transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="size-4" />
                  Tanya ketersediaan
                </a>
              ) : null}
              <a
                href="#unit"
                className={cn(
                  "inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors",
                  wa ? "ring-1 ring-white/20 hover:bg-white/5" : "bg-emerald-400 font-bold text-emerald-950 hover:bg-emerald-300"
                )}
              >
                Lihat unit
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>

          {/* Peta unit — data langsung dari sistem */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-400/20 via-transparent to-indigo-500/20 blur-2xl" />
            <div className="relative rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Peta unit</p>
                  <p className="text-xs text-white/50">Diperbarui otomatis dari sistem</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/60">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[4px] bg-emerald-400" />Tersedia</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[4px] bg-white/15" />Terisi</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {Array.from(blocks).map(([block, list]) => (
                  <div key={block} className="flex items-center gap-4">
                    <span className="w-9 shrink-0 font-mono text-xs font-semibold text-white/50">{block}</span>
                    <div className="flex flex-wrap gap-2">
                      {list.map((u) => (
                        <span
                          key={u.code}
                          title={`${u.code} · ${u.type} · ${u.occupied ? "Terisi" : "Tersedia"}`}
                          className={cn(
                            "flex h-10 w-12 items-center justify-center rounded-lg font-mono text-[11px] font-semibold transition-transform hover:-translate-y-0.5",
                            u.occupied
                              ? "bg-white/[0.07] text-white/40 ring-1 ring-white/10"
                              : "bg-emerald-400 text-emerald-950 shadow-[0_0_24px_-4px_rgb(52_211_153/0.8)]"
                          )}
                        >
                          {u.code.split("-")[1] ?? u.code}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
                <div>
                  <p className="text-2xl font-bold">{blockUnits.length}</p>
                  <p className="text-[11px] text-white/50">Total unit</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-300">{blockAvailable}</p>
                  <p className="text-[11px] text-white/50">Tersedia</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{blocks.size}</p>
                  <p className="text-[11px] text-white/50">Blok</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tipe unit */}
        <section id="unit" className="mx-auto max-w-6xl scroll-mt-10 px-5 pb-24 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">Pilihan unit</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pilih sesuai kebutuhan</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {types.map((t) => {
              const Icon = typeIcon[t.type] ?? Tag
              return (
                <div key={t.type} className="group relative overflow-hidden rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06]">
                  <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-emerald-400/10 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20">
                      <Icon className="size-6" />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        t.available > 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/60"
                      )}
                    >
                      {t.available > 0 ? `${t.available} tersedia` : "Penuh"}
                    </span>
                  </div>
                  <h3 className="relative mt-6 text-2xl font-bold">{t.type}</h3>
                  <p className="relative mt-1 text-sm text-white/55">{t.total} unit · sewa {t.period.toLowerCase()}</p>
                  <p className="relative mt-6 text-sm text-white/55">
                    Mulai{" "}
                    <span className="text-3xl font-extrabold tracking-tight text-white">{formatRupiah(t.minPrice)}</span>
                    <span className="text-white/55"> /bulan</span>
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Apartemen */}
        {apartments.length > 0 && (
          <section id="apartemen" className="mx-auto max-w-6xl scroll-mt-10 px-5 pb-24 sm:px-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">Apartemen</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Unit apartemen</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {apartments.map((a) => (
                <div key={a.code} className="group relative overflow-hidden rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06]">
                  <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-indigo-400/10 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20">
                      <Hotel className="size-6" />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        a.occupied ? "bg-white/10 text-white/60" : "bg-emerald-400/15 text-emerald-300"
                      )}
                    >
                      {a.occupied ? "Sedang disewa" : "Tersedia"}
                    </span>
                  </div>
                  <h3 className="relative mt-6 text-2xl font-bold">{a.code}</h3>
                  {a.description && (
                    <p className="relative mt-2 flex items-start gap-2 text-sm leading-relaxed text-white/60">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-white/40" />
                      {a.description}
                    </p>
                  )}
                  <p className="relative mt-6 text-sm text-white/55">
                    <span className="text-3xl font-extrabold tracking-tight text-white">{formatRupiah(a.price)}</span>
                    <span className="text-white/55"> /{a.period === "Tahunan" ? "tahun" : "bulan"}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Keunggulan */}
        <section id="keunggulan" className="mx-auto max-w-6xl scroll-mt-10 px-5 pb-24 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: ReceiptText, title: "Kuitansi digital", text: "Setiap pembayaran sewa dicatat sistem dan bisa dicetak sebagai kuitansi resmi." },
              { icon: CalendarCheck2, title: "Jatuh tempo jelas", text: "Masa sewa dihitung otomatis dari tanggal masuk, termasuk bulan yang lebih pendek." },
              { icon: Tag, title: "Tarif per unit tetap", text: "Harga sewa tiap unit tercatat jelas sehingga tidak ada biaya yang membingungkan." },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl bg-white/[0.03] p-7 ring-1 ring-white/10">
                <f.icon className="size-6 text-emerald-300" />
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-white/45 sm:flex-row sm:px-8">
          <div className="flex items-center gap-3">
            <BrandMark className="size-8" />
            <span>© {new Date().getFullYear()} Razmel&apos;s Property</span>
          </div>
          <Link href="/login" className="transition-colors hover:text-white">Portal staf →</Link>
        </div>
      </footer>
    </div>
  )
}
