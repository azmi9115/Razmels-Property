"use client"

import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"

export function SearchBar({ placeholder = "Cari..." }: { placeholder?: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "")

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const current = searchParams.get("query") || ""
      if (current === searchTerm) return

      const params = new URLSearchParams(searchParams)
      if (searchTerm) {
        params.set("query", searchTerm)
      } else {
        params.delete("query")
      }
      // Hasil pencarian baru selalu mulai dari halaman 1
      params.delete("page")

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, pathname, router, searchParams])

  return (
    <div className="relative w-full sm:w-72">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
      </div>
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-9"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  )
}
