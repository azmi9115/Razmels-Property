import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck2, MapPin, MessageCircle, ReceiptText, Tag } from "lucide-react"
import prisma from "@/lib/prisma"
import { BrandMark, BrandWordmark } from "@/components/brand"
import { HeroArt } from "@/components/landing/scene-art"
import { UnitBrowser, type LandingCard } from "@/components/landing/unit-browser"
import { isStandaloneUnit } from "@/lib/building-types"
import { formatRupiah, whatsappLink } from "@/lib/format"
import { landingGallery, landingPhoto, photoSlug } from "@/lib/landing-photos"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

// Template judul di layout tidak berlaku untuk halaman di segmen yang sama, jadi nama usaha ditulis di sini
const pageTitle = "Razmel's Property · Sewa kamar, kios & apartemen"
const pageDescription =
  "Razmel's Property menyewakan kamar, kios, dan apartemen di Daan Mogot (Jakarta Barat) dan Depok. Lihat unit yang masih tersedia beserta harga sewanya."

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  // Dipakai pratinjau tautan saat halaman dibagikan (mis. lewat WhatsApp)
  openGraph: { title: pageTitle, description: pageDescription, type: "website", locale: "id_ID" },
}

// Tata letak mengikuti desain acuan "Real Estate Property": bilah atas putih, hero bergambar dengan
// sudut kiri bawah melengkung, tombol pil, dan kartu bergambar dengan kotak isi yang menumpuk.

const PERIOD: Record<string, { per: string; label: string }> = {
  Bulanan: { per: "bulan", label: "bulanan" },
  Triwulan: { per: "3 bulan", label: "per tiga bulan" },
  Tahunan: { per: "tahun", label: "tahunan" },
}

const focusLight = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
// Tombol pil seperti di desain acuan: putih, berubah hitam saat disentuh
const pillWhite = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-ink transition-colors hover:bg-black hover:text-white active:translate-y-px",
  focusLight
)
const pillOutline = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium text-white ring-1 ring-white/60 transition-colors ring-inset hover:bg-white hover:text-ink active:translate-y-px",
  focusLight
)

export default async function LandingPage() {
  // Hanya data publik: kode unit, tipe, tarif, dan terisi/tidaknya. Tidak ada data penghuni.
  const buildings = await prisma.building.findMany({
    select: { code: true, type: true, rent_price: true, rent_period: true, description: true, tenants: { where: { status: "Active" }, select: { id: true } } },
  })

  const units = buildings
    .map((b) => ({ code: b.code, type: b.type, price: b.rent_price, period: b.rent_period, description: b.description, occupied: b.tenants.length > 0 }))
    .sort((a, b) => a.code.localeCompare(b.code, "id", { numeric: true }))
  const available = units.filter((u) => !u.occupied).length

  // Tiga properti: satu kontrakan (kamar & kios, nomornya dikelompokkan per blok) dan apartemen masing-masing satu kartu
  const rooms = units.filter((u) => !isStandaloneUnit(u.type))
  const singles = units.filter((u) => isStandaloneUnit(u.type))
  const blocks = new Map<string, typeof units>()
  for (const u of rooms) {
    const key = u.code.split("-")[0] || u.code
    blocks.set(key, [...(blocks.get(key) ?? []), u])
  }
  const fromPrice = (type: string) => {
    const list = rooms.filter((u) => u.type === type)
    return list.length ? Math.min(...list.map((u) => u.price)) : null
  }
  const blockNames = (type: string) => Array.from(blocks).filter(([, l]) => l[0].type === type).map(([n]) => n).join(" & ")
  const kamarFrom = fromPrice("Kamar")
  const kiosFrom = fromPrice("Kios")
  const freeRooms = rooms.filter((u) => !u.occupied)

  const cards: LandingCard[] = [
    ...(rooms.length
      ? [
          {
            key: "kontrakan",
            type: "Kontrakan",
            title: "Kontrakan Razmel's",
            description: [
              `${rooms.filter((u) => u.type === "Kamar").length} kamar (blok ${blockNames("Kamar")}) dan ${rooms.filter((u) => u.type === "Kios").length} kios (blok ${blockNames("Kios")}), sewa bulanan.`,
              kamarFrom !== null && kiosFrom !== null && `Kamar ${formatRupiah(kamarFrom)}, kios mulai ${formatRupiah(kiosFrom)} per bulan.`,
            ]
              .filter(Boolean)
              .join(" "),
            units: rooms.map((u) => ({ code: u.code, label: u.code.split("-")[1] ?? u.code, occupied: u.occupied })),
            groups: Array.from(blocks, ([name, list]) => ({
              name,
              units: list.map((u) => ({ code: u.code, label: u.code.split("-")[1] ?? u.code, occupied: u.occupied })),
            })),
            single: false,
            price: Math.min(...rooms.map((u) => u.price)),
            priceVaries: new Set(rooms.map((u) => u.price)).size > 1,
            per: "bulan",
            photos: landingGallery("kontrakan"),
            art: "kos" as const,
            freeNote: freeRooms.length > 0 ? `Kosong: ${freeRooms.map((u) => u.code).join(", ")}` : null,
          } satisfies LandingCard,
        ]
      : []),
    ...singles.map(
      (u): LandingCard => ({
        key: u.code,
        type: u.type,
        title: u.code,
        description: u.description || null,
        units: [{ code: u.code, label: u.code, occupied: u.occupied }],
        single: true,
        price: u.price,
        priceVaries: false,
        per: (PERIOD[u.period] ?? PERIOD.Bulanan).per,
        photos: landingGallery(photoSlug(u.code)),
        art: /lagoon|laguna|sky|pantai/i.test(u.code) ? "tower-lagoon" : "tower-garden",
        freeNote: null,
      })
    ),
  ]

  const wa = whatsappLink(siteConfig.whatsapp, "Halo Razmel's Property, saya ingin menanyakan unit yang masih tersedia.")
  const heroPhoto = landingPhoto("hero")
  const heroPhotoMobile = landingPhoto("hero-hp")
  // Ringkasan per jenis, mis. "Kosong: 2 kamar, 1 kios, 1 apartemen"
  const freeByType = ["Kamar", "Kios", "Apartemen"]
    .map((t) => [t.toLowerCase(), units.filter((u) => u.type === t && !u.occupied).length] as const)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${t}`)
  const availability = available > 0 ? `Kosong: ${freeByType.join(", ")}` : "Semua unit sedang terisi"

  const steps = [
    { title: "Pilih unit yang tersedia", text: "Lihat properti di atas. Di kontrakan, nomor kamar atau kios yang masih kosong ditandai hijau." },
    {
      title: wa ? "Chat pengelola lewat WhatsApp" : "Hubungi pengelola",
      text: wa
        ? `Kirim pesan ke ${siteConfig.whatsapp} dan sebutkan unit yang Anda minati. Sewa diurus langsung lewat WhatsApp.`
        : "Sebutkan unit yang Anda minati, lalu atur waktu untuk melihatnya langsung.",
    },
    { title: "Bayar dan terima kuitansi", text: "Setiap pembayaran sewa dicatat, dan Anda menerima kuitansinya." },
  ]

  const benefits = [
    { icon: Tag, title: "Tarif tetap per unit", text: "Harga sewa tiap unit tercatat jelas. Yang tertulis di halaman ini adalah tarif di catatan pengelola." },
    { icon: ReceiptText, title: "Kuitansi setiap bayar", text: "Setiap pembayaran sewa dicatat sistem dan bisa dicetak sebagai kuitansi." },
    { icon: CalendarCheck2, title: "Jatuh tempo jelas", text: "Masa sewa dihitung dari tanggal masuk Anda, termasuk untuk bulan yang lebih pendek." },
  ]

  return (
    <div className="landing min-h-screen">
      <a href="#unit" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white">
        Lewati ke daftar properti
      </a>

      {/* Bilah atas putih: merek di kiri, info singkat di kanan */}
      <header className="bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
            <BrandMark className="size-10" />
            <BrandWordmark subtitle="Kamar, Kios & Apartemen" />
          </Link>
          <div className="flex items-center gap-5 text-[15px]">
            {siteConfig.area && (
              <>
                <span className="hidden items-center gap-2.5 md:flex">
                  <span className="flex size-[30px] items-center justify-center rounded-full bg-mist">
                    <MapPin className="size-4" />
                  </span>
                  {siteConfig.area}
                </span>
                <span aria-hidden="true" className="hidden h-7 w-px bg-ink/25 md:block" />
              </>
            )}
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-full hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
                <span className="flex size-[30px] items-center justify-center rounded-full bg-mist">
                  <MessageCircle className="size-4" />
                </span>
                {/* HP: cukup label, nomornya ada di tombol dan bagian kontak */}
                <span className="whitespace-nowrap sm:hidden">Chat WhatsApp</span>
                <span className="hidden whitespace-nowrap sm:inline">WhatsApp: {siteConfig.whatsapp}</span>
              </a>
            ) : (
              <span className="flex items-center gap-2.5">
                <span className="flex size-[30px] items-center justify-center rounded-full bg-mist">
                  <span className={cn("size-2 rounded-full", available > 0 ? "bg-emerald-500" : "bg-ink/30")} />
                </span>
                {/* HP: versi ringkas supaya muat satu baris */}
                <span className="sm:hidden">{available > 0 ? `${available} tersedia` : "Sedang penuh"}</span>
                <span className="hidden sm:inline">{availability}</span>
              </span>
            )}
            {wa && (
              <>
                <span aria-hidden="true" className="hidden h-7 w-px bg-ink/25 sm:block" />
                <Link href="/login" className="hidden rounded-md font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:block">
                  Masuk staf
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero: gambar gelap dengan sudut kiri bawah melengkung, menu di atas gambar, teks rata kanan */}
        <section id="top" className="relative isolate overflow-hidden rounded-bl-[72px] bg-black text-white sm:rounded-bl-[140px] xl:rounded-bl-[230px]">
          {heroPhoto ? (
            <>
              {/* Foto digelapkan seperti di desain acuan; HP memakai versi tegak kalau ada */}
              <picture>
                {heroPhotoMobile && <source media="(max-width: 767px)" srcSet={heroPhotoMobile} />}
                <img src={heroPhoto} alt="" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover opacity-45" />
              </picture>
              {/* Lapisan gelap di sisi teks supaya tulisan tetap terbaca di atas foto */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/20 to-transparent xl:bg-gradient-to-l xl:from-black/55 xl:via-black/15" />
            </>
          ) : (
            <div className="landing-sky absolute inset-0 -z-10">
              <HeroArt />
            </div>
          )}

          <nav aria-label="Navigasi utama" className="absolute inset-x-0 top-0 z-10">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
              <ul className="no-scrollbar -mx-1 flex min-w-0 items-center gap-4 overflow-x-auto px-1 py-1 text-sm whitespace-nowrap sm:gap-7 sm:text-base">
                <li>
                  <a href="#top" aria-current="page" className={cn("border-b border-white pb-1", focusLight)}>
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="#unit" className={cn("border-b border-transparent pb-1 transition-colors hover:border-white/70", focusLight)}>
                    Properti
                  </a>
                </li>
                <li>
                  <a href="#cara" className={cn("border-b border-transparent pb-1 transition-colors hover:border-white/70", focusLight)}>
                    Cara menyewa
                  </a>
                </li>
                {wa && (
                  <li>
                    <a href="#kontak" className={cn("border-b border-transparent pb-1 transition-colors hover:border-white/70", focusLight)}>
                      Kontak
                    </a>
                  </li>
                )}
              </ul>
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" className={cn(pillWhite, "hidden shrink-0 sm:inline-flex")}>
                  Tanya pengelola
                </a>
              ) : (
                <Link href="/login" className={cn(pillWhite, "hidden shrink-0 sm:inline-flex")}>
                  Masuk staf
                </Link>
              )}
            </div>
          </nav>

          <div
            className={cn(
              "mx-auto flex max-w-6xl flex-col px-5 pt-28 sm:px-8 sm:pt-32 xl:min-h-[max(700px,42vw)] xl:justify-center xl:pt-28",
              heroPhoto ? "min-h-[640px] justify-center pb-20 sm:min-h-[680px] xl:pb-16" : "pb-[240px] sm:pb-[250px] lg:pb-[260px] xl:pb-[9vw]"
            )}
          >
            <div className="max-w-xl lg:max-w-3xl xl:ml-auto xl:max-w-[41rem] xl:text-right">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-white/25 ring-inset">
                <span className={cn("size-2 rounded-full", available > 0 ? "bg-emerald-400" : "bg-white/50")} />
                {availability}
              </p>
              <h1 className="mt-5 text-[40px] leading-[1.12] font-semibold tracking-[-0.01em] text-balance sm:text-[52px] xl:text-[50px]">
                Hunian & tempat usaha, <br className="hidden xl:block" />
                dikelola dengan rapi.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-balance text-white/90 xl:ml-auto xl:max-w-[33rem]">
                Razmel&apos;s Property menyewakan kontrakan (kamar dan kios) serta dua apartemen: Sky Terrace Lagoon di Daan Mogot, Jakarta Barat, dan Grand Taman Melati 2 di Depok.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 xl:justify-end">
                <a href="#unit" className={pillWhite}>
                  Lihat unit tersedia
                </a>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className={pillOutline}>
                    <MessageCircle className="size-[18px]" />
                    Tanya via WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Properti: kontrakan dan dua apartemen, masing-masing satu kartu dengan galeri foto */}
        <section id="unit" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-[32px] leading-tight font-medium sm:text-[40px]">Properti kami</h2>
          <p className="mt-3 mb-7 max-w-2xl text-base leading-7 text-ink/80">
            Satu kontrakan dan dua apartemen. Geser foto untuk melihat lebih banyak; status kosong atau disewa diambil langsung dari catatan pengelola.
          </p>
          <UnitBrowser cards={cards} whatsapp={siteConfig.whatsapp} />
        </section>

        {/* Cara menyewa: memang berurutan, jadi diberi nomor */}
        <section id="cara" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-20 sm:px-8 sm:pb-24">
          <h2 className="text-[32px] leading-tight font-medium sm:text-[40px]">Cara menyewa</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-[30px] bg-mist p-6 sm:p-7">
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-lg font-semibold">{i + 1}</span>
                <h3 className="mt-5 text-xl font-medium">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-ink/80">{step.text}</p>
              </li>
            ))}
          </ol>

          <ul className="mt-12 grid gap-8 border-t border-ink/15 pt-10 md:grid-cols-3">
            {benefits.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
                  <b.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-[17px] font-medium">{b.title}</h3>
                  <p className="mt-1 text-[15px] leading-6 text-ink/80">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Penutup: lengkung di kanan atas, cerminan lengkung hero */}
      <footer id="kontak" className="scroll-mt-6 rounded-tr-[72px] bg-ink text-white sm:rounded-tr-[140px] xl:rounded-tr-[230px]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {wa && (
            <div className="flex flex-col gap-7 border-b border-white/15 py-14 md:flex-row md:items-center md:justify-between md:py-16">
              <div className="max-w-xl">
                <h2 className="text-[30px] leading-tight font-medium sm:text-[36px]">Tertarik menyewa?</h2>
                <p className="mt-3 text-base leading-7 text-white/85">Mau menyewa atau tanya-tanya dulu? Langsung chat pengelola di {siteConfig.whatsapp}.</p>
              </div>
              <a href={wa} target="_blank" rel="noreferrer" className={cn(pillWhite, "shrink-0 self-start md:self-auto")}>
                <MessageCircle className="size-[18px]" />
                Chat via WhatsApp
              </a>
            </div>
          )}

          <div className={cn("flex flex-col gap-8 pb-10 md:flex-row md:items-start md:justify-between", wa ? "pt-10" : "pt-16")}>
            <div className="flex items-center gap-3">
              <BrandMark className="size-10" />
              <BrandWordmark subtitle="Kamar, Kios & Apartemen" />
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
              <li>
                <a href="#unit" className={cn("underline-offset-4 hover:underline", focusLight)}>
                  Properti
                </a>
              </li>
              <li>
                <a href="#cara" className={cn("underline-offset-4 hover:underline", focusLight)}>
                  Cara menyewa
                </a>
              </li>
              <li>
                <Link href="/login" className={cn("underline-offset-4 hover:underline", focusLight)}>
                  Masuk staf pengelola
                </Link>
              </li>
            </ul>
          </div>

          <p className="border-t border-white/15 py-5 text-sm text-white/75">© {new Date().getFullYear()} Razmel&apos;s Property</p>
        </div>
      </footer>
    </div>
  )
}
