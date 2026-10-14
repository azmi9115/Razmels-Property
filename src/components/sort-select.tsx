"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"

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
    <div className="relative">
      <select
        aria-label="Urutkan"
        className="h-9 cursor-pointer appearance-none rounded-lg border border-input bg-card pr-8 pl-3 text-sm font-medium shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        value={currentSort}
        onChange={handleSort}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
