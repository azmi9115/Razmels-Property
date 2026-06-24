"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function SortSelect({ options }: { options: { label: string, value: string }[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const currentSort = searchParams.get("sort") || options[0].value

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", e.target.value)
    // Reset to page 1 when sorting changes
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select 
      className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      value={currentSort}
      onChange={handleSort}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
