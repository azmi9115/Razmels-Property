import { existsSync } from "fs"
import path from "path"

// Foto asli untuk halaman depan cukup ditaruh di public/landing dengan nama slot-nya, tanpa ubah kode:
//   hero.jpg                                → gambar besar di bagian atas
//   blok-ba.jpg, blok-bb.jpg, blok-da.jpg…  → kartu tiap blok
//   kamar.jpg, kios.jpg                     → dipakai semua blok bertipe itu kalau foto bloknya belum ada
//   apartment-sky-terrace-lagoon.jpg…       → kartu apartemen (nama unit, huruf kecil, spasi jadi "-")
// Slot tanpa foto memakai ilustrasi. Hanya dipanggil dari server (halaman depan).
const DIR = path.join(process.cwd(), "public", "landing")
const EXTENSIONS = ["webp", "jpg", "jpeg", "png"]

export const photoSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// Foto pertama yang ada dari daftar slot, atau null kalau belum ada satu pun
export function landingPhoto(...slots: string[]): string | null {
  for (const slot of slots) {
    for (const ext of EXTENSIONS) {
      if (existsSync(path.join(DIR, `${slot}.${ext}`))) return `/landing/${slot}.${ext}`
    }
  }
  return null
}
