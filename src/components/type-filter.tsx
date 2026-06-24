"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function TypeFilter() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const currentType = searchParams.get("type") || "all"

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === "all") {
      params.delete("type")
    } else {
      params.set("type", e.target.value)
    }
    // Reset to page 1 when type changes
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select 
      className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      value={currentType}
      onChange={handleTypeChange}
    >
      <option value="all">Semua Tipe</option>
      <option value="Pemasukan">Pemasukan Saja</option>
      <option value="Pengeluaran">Pengeluaran Saja</option>
    </select>
  )
}
