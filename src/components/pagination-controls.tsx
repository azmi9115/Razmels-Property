"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function PaginationControls({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return <span key={`ellipsis-${idx}`} className="px-1.5 text-muted-foreground">…</span>
      }
      return (
        <Button
          key={p}
          variant={currentPage === p ? "default" : "outline"}
          size="sm"
          className={`size-8 p-0 tabular-nums ${currentPage === p ? 'pointer-events-none' : ''}`}
          onClick={() => handlePageChange(p as number)}
        >
          {p}
        </Button>
      )
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
      <div className="hidden text-[13px] text-muted-foreground sm:block">
        Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari <span className="font-semibold text-foreground">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Mundur</span>
        </Button>
        
        <div className="flex items-center gap-1 mx-2">
          {renderPageNumbers()}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <span className="hidden sm:inline">Maju</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  )
}
