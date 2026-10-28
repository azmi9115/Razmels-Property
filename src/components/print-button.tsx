"use client"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintButton({ label = "Cetak kuitansi" }: { label?: string }) {
  return (
    <Button size="lg" onClick={() => window.print()}>
      <Printer className="size-4" /> {label}
    </Button>
  )
}
