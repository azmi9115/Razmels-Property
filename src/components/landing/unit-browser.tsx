"use client"

import { useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, MoveRight } from "lucide-react"
import { KiosArt, KosArt, TowerArt } from "@/components/landing/scene-art"
import { formatRupiah, whatsappLink } from "@/lib/format"
import type { UnitDetail } from "@/lib/landing-details"
import { cn } from "@/lib/utils"

export type LandingUnit = { code: string; label: string; occupied: boolean }

// Satu kartu di halaman depan: kontrakan (kamar & kios, nomornya per blok) atau satu apartemen
export type LandingCard = {
  key: string
  type: string
  title: string
  description: string | null
  units: LandingUnit[]
  /** Nomor unit dikelompokkan per blok (kontrakan) */
  groups?: { name: string; units: LandingUnit[] }[]
  /** true = unit berdiri sendiri (apartemen), tanpa deret nomor */
  single: boolean
  price: number
  priceVaries: boolean
  per: string
  /** Foto asli dari public/landing, urut tampil; kosong = pakai ilustrasi */
  photos: string[]
  art: "kos" | "kios" | "tower-lagoon" | "tower-garden"
  /** Ringkasan nomor yang kosong, mis. "Kosong: BA-6, DA-2" */
  freeNote: string | null
  /** Detail apartemen (spesifikasi, fasilitas, harga lain); dibuka lewat "Lihat detail unit" */
  detail?: UnitDetail | null
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

export function UnitBrowser({ cards, whatsapp }: { cards: LandingCard[]; whatsapp: string }) {
  const usesArt = cards.some((c) => c.photos.length === 0)
  const canAsk = whatsappLink(whatsapp) !== null
  const hasNumbers = cards.some((c) => !c.single)

  return (
    <div>
      {hasNumbers && (
        <p className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/75">
          <span className="flex items-center gap-2">
            <span className="size-4 rounded-full bg-emerald-700" />
            Nomor hijau: kosong
          </span>
          <span className="flex items-center gap-2">
            <span className="size-4 rounded-full bg-white ring-1 ring-ink/25 ring-inset" />
            Nomor putih: sedang disewa
          </span>
          {canAsk && <span>Ketuk nomor hijau untuk menanyakan kamar atau kios itu lewat WhatsApp.</span>}
        </p>
      )}

      <ul className="mt-8 grid items-start gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.key}>
            <UnitCard card={card} whatsapp={whatsapp} />
          </li>
        ))}
      </ul>

      {usesArt && <p className="mt-8 text-sm text-ink/70">Gambar yang belum berupa foto adalah ilustrasi. Status tiap unit diambil dari catatan pengelola.</p>}
    </div>
  )
}

// Kartu mengikuti desain acuan: gambar bersudut bulat, label jenis di kiri bawah gambar,
// dan kotak isi abu terang yang menumpuk di tepi bawah gambar
function UnitCard({ card, whatsapp }: { card: LandingCard; whatsapp: string }) {
  const free = card.units.filter((u) => !u.occupied)
  const ask = whatsappLink(whatsapp, `Halo Razmel's Property, saya tertarik dengan ${card.title}. Apakah masih ada yang kosong?`)
  const status = card.single ? (free.length > 0 ? "Tersedia" : "Sedang disewa") : free.length > 0 ? `${free.length} kosong` : "Penuh"

  return (
    <article className="group">
      <div className="relative aspect-[10/7] overflow-hidden rounded-[30px] bg-[#1c2430]">
        {card.photos.length > 0 ? (
          <Gallery photos={card.photos} title={card.title} />
        ) : (
          <div className="size-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]">
            <CardArt card={card} />
          </div>
        )}
        <span className="pointer-events-none absolute bottom-[45px] left-[25px] rounded-full bg-ink px-4 py-1 text-sm font-medium text-white">{card.type}</span>
        <span className="pointer-events-none absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-ink">
          <span className={cn("size-2 rounded-full", free.length > 0 ? "bg-emerald-500" : "bg-ink/30")} />
          {status}
        </span>
      </div>

      <div className="relative mx-4 -mt-[35px] rounded-[30px] bg-mist p-5 sm:mx-[25px]">
        <h3 className="text-xl leading-snug font-medium">{card.title}</h3>
        {card.description && <p className="mt-2 text-sm leading-6 text-ink/80">{card.description}</p>}

        {card.groups && (
          <div className="mt-3 space-y-1.5">
            {card.groups.map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-[13px] font-semibold text-ink/75">{g.name}</span>
                <ul className="flex flex-wrap gap-1">
                  {g.units.map((u) => (
                    <li key={u.code}>
                      <UnitChip unit={u} whatsapp={whatsapp} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {card.freeNote && <p className="mt-3 text-sm font-medium text-emerald-800">{card.freeNote}</p>}
        {card.detail && <DetailPanel detail={card.detail} />}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-ink/75">
            {card.priceVaries && "Mulai "}
            <span className="text-[17px] font-semibold text-ink">{formatRupiah(card.price)}</span> /{card.per}
          </p>
          <a
            href={ask ?? "#cara"}
            {...(ask ? { target: "_blank", rel: "noreferrer" } : {})}
            aria-label={ask ? `Tanya ${card.title} lewat WhatsApp` : `Cara menyewa ${card.title}`}
            className={cn("-mr-1.5 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-ink hover:text-white", focusRing)}
          >
            <MoveRight className="size-6" strokeWidth={1.6} />
          </a>
        </div>
      </div>
    </article>
  )
}

// Detail dari caption iklan pemilik; tertutup secara bawaan supaya kartu tetap ringkas
function DetailPanel({ detail }: { detail: UnitDetail }) {
  const list = (title: string, items: string[]) =>
    items.length > 0 && (
      <div>
        <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
        <ul className="mt-1 space-y-0.5 text-sm leading-6 text-ink/80">
          {items.map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden="true" className="mt-[11px] size-1 shrink-0 rounded-full bg-ink/40" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    )
  return (
    <details className="group/detail mt-3 border-t border-ink/10 pt-3">
      <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden", focusRing)}>
        Lihat detail unit
        <ChevronDown className="size-4 transition-transform group-open/detail:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="mt-3 space-y-4">
        {list("Spesifikasi", detail.specs)}
        {detail.prices.length > 0 && (
          <div>
            <h4 className="text-[13px] font-semibold text-ink">Pilihan sewa lain</h4>
            <dl className="mt-1 space-y-0.5 text-sm leading-6">
              {detail.prices.map((p) => (
                <div key={p.label} className="flex gap-2">
                  <dt className="w-[68px] shrink-0 text-ink/70">{p.label}</dt>
                  <dd className="text-ink/90">{p.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {list("Di dalam unit", detail.inUnit)}
        {list("Fasilitas gedung", detail.building)}
        {list("Sekitar", detail.nearby)}
        {detail.address && <p className="text-sm leading-6 text-ink/80"><span className="font-semibold text-ink">Alamat:</span> {detail.address}</p>}
      </div>
    </details>
  )
}

function UnitChip({ unit, whatsapp }: { unit: LandingUnit; whatsapp: string }) {
  const link = unit.occupied ? null : whatsappLink(whatsapp, `Halo Razmel's Property, saya tertarik dengan unit ${unit.code}. Apakah masih kosong?`)
  const chip = cn("flex size-[28px] items-center justify-center rounded-full text-xs font-semibold", unit.occupied ? "bg-white text-ink/60" : "bg-emerald-700 text-white")
  const text = (
    <>
      <span aria-hidden="true">{unit.label}</span>
      <span className="sr-only">
        {unit.code}, {unit.occupied ? "sedang disewa" : "kosong"}
      </span>
    </>
  )
  const title = `${unit.code}: ${unit.occupied ? "sedang disewa" : "kosong"}`
  return link ? (
    <a href={link} target="_blank" rel="noreferrer" title={title} className={cn(chip, "transition-colors hover:bg-emerald-800", focusRing)}>
      {text}
    </a>
  ) : (
    <span title={title} className={chip}>
      {text}
    </span>
  )
}

// Galeri foto: geser di HP, tombol panah di layar besar; tanpa putar otomatis
function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const many = photos.length > 1

  const go = (step: number) => {
    const el = ref.current
    if (!el) return
    const next = Math.min(photos.length - 1, Math.max(0, index + step))
    el.scrollTo({ left: next * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }

  const arrow = cn(
    "absolute top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink transition-opacity hover:bg-white sm:flex",
    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
    focusRing
  )

  return (
    <>
      <div
        ref={ref}
        role={many ? "region" : undefined}
        aria-label={many ? `Foto ${title}` : undefined}
        tabIndex={many ? 0 : undefined}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1)
          if (e.key === "ArrowLeft") go(-1)
        }}
        className={cn("no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto", focusRing)}
      >
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={many ? `Foto ${title}, ${i + 1} dari ${photos.length}` : `Foto ${title}`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className="size-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {many && (
        <>
          {index > 0 && (
            <button type="button" onClick={() => go(-1)} aria-label="Foto sebelumnya" className={cn(arrow, "left-3")}>
              <ChevronLeft className="size-5" />
            </button>
          )}
          {index < photos.length - 1 && (
            <button type="button" onClick={() => go(1)} aria-label="Foto berikutnya" className={cn(arrow, "right-3")}>
              <ChevronRight className="size-5" />
            </button>
          )}
          <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
            {index + 1}/{photos.length}
          </span>
        </>
      )}
    </>
  )
}

function CardArt({ card }: { card: LandingCard }) {
  const uid = `seni-${card.key}`
  if (card.art === "kios") return <KiosArt uid={uid} units={card.units.map((u) => ({ label: u.code, occupied: u.occupied }))} />
  if (card.art === "kos") return <KosArt uid={uid} units={card.units.map((u) => ({ label: u.label, occupied: u.occupied }))} />
  return <TowerArt uid={uid} variant={card.art === "tower-lagoon" ? "lagoon" : "garden"} available={card.units.some((u) => !u.occupied)} />
}
