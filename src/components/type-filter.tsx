"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const options = [
  { value: "all", label: "Semua" },
  { value: "Pemasukan", label: "Pemasukan" },
  { value: "Pengeluaran", label: "Pengeluaran" },
]

export function TypeFilter() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const currentType = searchParams.get("type") || "all"

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("type")
    } else {
      params.set("type", value)
    }
    // Reset to page 1 when type changes
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div role="radiogroup" aria-label="Filter tipe transaksi" className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={currentType === o.value}
          onClick={() => handleTypeChange(o.value)}
          className={cn(
            "h-7 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
            currentType === o.value && "bg-card text-foreground shadow-sm"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
