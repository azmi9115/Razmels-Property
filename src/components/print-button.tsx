"use client"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-sm hover:bg-primary/90 transition-all font-medium"
    >
      <Printer className="h-4 w-4" /> Cetak Invoice
    </button>
  )
}
