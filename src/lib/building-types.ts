// Pilihan tipe unit di form Tambah/Edit. Nilai disimpan apa adanya di kolom Building.type.
export const BUILDING_TYPES = ["Kamar", "Kios", "Kontrakan", "Apartemen"] as const

// Unit berdiri sendiri (bukan bagian blok BA/BB/...) — dikelompokkan terpisah di halaman unit & landing
export function isStandaloneUnit(type: string): boolean {
  return type === "Apartemen"
}

// Kunci grup: apartemen jadi satu grup, sisanya per awalan kode ("BA-1" → "BA")
export function unitGroupKey(b: { code: string; type: string }): string {
  return isStandaloneUnit(b.type) ? "Apartemen" : b.code.split("-")[0] || b.code
}
