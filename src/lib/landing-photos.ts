import { existsSync } from "fs"
import path from "path"

// Foto asli untuk halaman depan cukup ditaruh di public/landing dengan nama slot-nya, tanpa ubah kode:
//   hero.jpg                                → gambar besar di bagian atas (mendatar)
//   hero-hp.jpg                             → versi tegak untuk layar HP (opsional)
//   kontrakan.jpg, kontrakan-1.jpg, -2…     → galeri kartu kontrakan (kamar & kios)
//   apartment-sky-terrace-lagoon.jpg, -1…   → galeri kartu apartemen (nama unit, huruf kecil, spasi jadi "-")
// Slot tanpa foto memakai ilustrasi. Hanya dipanggil dari server (halaman depan).
const DIR = path.join(process.cwd(), "public", "landing")
const EXTENSIONS = ["webp", "jpg", "jpeg", "png"]

export const photoSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// Semua foto satu slot untuk galeri kartu: slot.jpg lalu slot-1.jpg, slot-2.jpg, … (urut nomor)
export function landingGallery(slot: string): string[] {
  const out: string[] = []
  const first = landingPhoto(slot)
  if (first) out.push(first)
  for (let i = 1; i <= 30; i++) {
    const p = landingPhoto(`${slot}-${i}`)
    if (p) out.push(p)
  }
  return out
}

// Foto pertama yang ada dari daftar slot, atau null kalau belum ada satu pun
export function landingPhoto(...slots: string[]): string | null {
  for (const slot of slots) {
    for (const ext of EXTENSIONS) {
      if (existsSync(path.join(DIR, `${slot}.${ext}`))) return `/landing/${slot}.${ext}`
    }
  }
  return null
}
