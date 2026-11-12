"use client"

import { useState } from "react"
import { Check, MoveRight } from "lucide-react"
import { KiosArt, KosArt, TowerArt } from "@/components/landing/scene-art"
import { formatRupiah, whatsappLink } from "@/lib/format"
import { cn } from "@/lib/utils"

export type LandingUnit = { code: string; label: string; occupied: boolean }

// Satu kartu di halaman depan: satu blok (kamar/kios) atau satu unit apartemen
export type LandingCard = {
  key: string
  type: string
  title: string
  description: string | null
  units: LandingUnit[]
  /** true = unit berdiri sendiri (apartemen), tanpa deret nomor */
  single: boolean
  price: number
  priceVaries: boolean
  per: string
  /** Foto asli dari public/landing; null = pakai ilustrasi */
  photo: string | null
  art: "kos" | "kios" | "tower-lagoon" | "tower-garden"
}

const ALL = "Semua"
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

export function UnitBrowser({ cards, whatsapp }: { cards: LandingCard[]; whatsapp: string }) {
  const [type, setType] = useState(ALL)
  const [onlyFree, setOnlyFree] = useState(false)

  const types = Array.from(new Set(cards.map((c) => c.type)))
  const countOf = (t: string) => cards.filter((c) => t === ALL || c.type === t).reduce((n, c) => n + c.units.length, 0)
  const shown = cards.filter((c) => (type === ALL || c.type === type) && (!onlyFree || c.units.some((u) => !u.occupied)))
  const usesArt = cards.some((c) => !c.photo)
  const canAsk = whatsappLink(whatsapp) !== null

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Saring jenis unit" className="flex flex-wrap gap-2">
          {[ALL, ...types].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors active:translate-y-px",
                focusRing,
                type === t ? "bg-ink text-white" : "bg-mist text-ink hover:bg-ink/10"
              )}
            >
              {t}
              <span className={cn("text-[13px]", type === t ? "text-white/70" : "text-ink/60")}>{countOf(t)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={onlyFree}
          onClick={() => setOnlyFree((v) => !v)}
          className={cn(
            "inline-flex h-11 items-center gap-2.5 rounded-full px-5 text-[15px] font-medium transition-colors active:translate-y-px sm:ml-auto",
            focusRing,
            onlyFree ? "bg-emerald-700 text-white" : "text-ink ring-1 ring-ink/25 ring-inset hover:bg-mist"
          )}
        >
          <span className={cn("flex size-[18px] items-center justify-center rounded-full", onlyFree ? "bg-white text-emerald-700" : "ring-1 ring-ink/40 ring-inset")}>
            {onlyFree && <Check className="size-3" strokeWidth={3.5} />}
          </span>
          Hanya yang tersedia
        </button>
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/75">
        <span className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-emerald-700" />
          Nomor hijau: tersedia
        </span>
        <span className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-white ring-1 ring-ink/25 ring-inset" />
          Nomor putih: sedang disewa
        </span>
        {canAsk && <span>Ketuk nomor hijau untuk menanyakan unit itu lewat WhatsApp.</span>}
      </p>

      <p className="sr-only" aria-live="polite">
        Menampilkan {shown.length} pilihan
      </p>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-[30px] bg-mist px-6 py-12 text-center">
          <p className="text-xl font-medium">Belum ada {type === ALL ? "unit" : type.toLowerCase()} yang tersedia saat ini</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-ink/80">
            Status di halaman ini berubah begitu ada unit yang kosong. Anda tetap bisa melihat semua pilihannya.
          </p>
          <button
            type="button"
            onClick={() => setOnlyFree(false)}
            className={cn("mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[15px] font-medium text-white transition-colors hover:bg-black active:translate-y-px", focusRing)}
          >
            Tampilkan semua {type === ALL ? "unit" : type.toLowerCase()}
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((card) => (
            <li key={card.key}>
              <UnitCard card={card} whatsapp={whatsapp} />
            </li>
          ))}
        </ul>
      )}

      {usesArt && shown.length > 0 && (
        <p className="mt-8 text-sm text-ink/70">Gambar bangunan di atas berupa ilustrasi. Status tiap unit diambil dari catatan pengelola.</p>
      )}
    </div>
  )
}

// Kartu mengikuti desain acuan: gambar bersudut bulat, label jenis di kiri bawah gambar,
// dan kotak isi abu terang yang menumpuk di tepi bawah gambar
function UnitCard({ card, whatsapp }: { card: LandingCard; whatsapp: string }) {
  const free = card.units.filter((u) => !u.occupied)
  const ask = whatsappLink(whatsapp, `Halo Razmel's Property, saya tertarik dengan ${card.title}. Apakah masih ada yang kosong?`)
  const status = card.single ? (free.length > 0 ? "Tersedia" : "Sedang disewa") : free.length > 0 ? `${free.length} tersedia` : "Penuh"
  const zoom = "size-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"

  return (
    <article className="group">
      <div className="relative aspect-[10/7] overflow-hidden rounded-[30px] bg-[#1c2430]">
        {card.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photo} alt={`Foto ${card.title}`} loading="lazy" decoding="async" className={cn(zoom, "object-cover")} />
        ) : (
          <div className={zoom}>
            <CardArt card={card} />
          </div>
        )}
        <span className="absolute bottom-[45px] left-[25px] rounded-full bg-ink px-4 py-1 text-sm font-medium text-white">{card.type}</span>
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-ink">
          <span className={cn("size-2 rounded-full", free.length > 0 ? "bg-emerald-500" : "bg-ink/30")} />
          {status}
        </span>
      </div>

      <div className="relative mx-4 -mt-[35px] rounded-[30px] bg-mist p-5 sm:mx-[25px]">
        <h3 className="text-xl leading-snug font-medium">{card.title}</h3>
        {card.description && <p className="mt-2 text-sm leading-6 text-ink/80">{card.description}</p>}

        {!card.single && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {card.units.map((u) => {
              const link = u.occupied ? null : whatsappLink(whatsapp, `Halo Razmel's Property, saya tertarik dengan unit ${u.code}. Apakah masih kosong?`)
              const chip = cn(
                "flex size-[30px] items-center justify-center rounded-full text-xs font-semibold",
                u.occupied ? "bg-white text-ink/50" : "bg-emerald-700 text-white"
              )
              const text = (
                <>
                  <span aria-hidden="true">{u.label}</span>
                  <span className="sr-only">
                    {u.code}, {u.occupied ? "sedang disewa" : "tersedia"}
                  </span>
                </>
              )
              return (
                <li key={u.code} title={`${u.code}: ${u.occupied ? "sedang disewa" : "tersedia"}`}>
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer" className={cn(chip, "transition-colors hover:bg-emerald-800", focusRing)}>
                      {text}
                    </a>
                  ) : (
                    <span className={chip}>{text}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

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

function CardArt({ card }: { card: LandingCard }) {
  const uid = `seni-${card.key}`
  if (card.art === "kios") return <KiosArt uid={uid} units={card.units.map((u) => ({ label: u.code, occupied: u.occupied }))} />
  if (card.art === "kos") return <KosArt uid={uid} units={card.units.map((u) => ({ label: u.label, occupied: u.occupied }))} />
  return <TowerArt uid={uid} variant={card.art === "tower-lagoon" ? "lagoon" : "garden"} available={card.units.some((u) => !u.occupied)} />
}
