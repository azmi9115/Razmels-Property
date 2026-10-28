"use client"

import { useTransition } from "react"
import { Check, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { markReviewed, unmarkReviewed } from "@/app/actions/review"

// Tombol tinjau temuan: "Sudah benar" menyembunyikan temuan ini seterusnya, "Batalkan" memunculkannya lagi
export function ReviewButton({ cashflowId, rule, reviewed = false }: { cashflowId: string; rule: string; reviewed?: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const res = reviewed ? await unmarkReviewed(cashflowId, rule) : await markReviewed(cashflowId, rule)
      if (res.error) toast.error(res.error)
      else toast.success(reviewed ? "Temuan dimunculkan lagi" : "Ditandai sudah benar — tidak akan ditandai lagi")
    })
  }

  return (
    <Button size="sm" variant="outline" className="h-8 gap-1.5 whitespace-nowrap" disabled={pending} onClick={handleClick}>
      {reviewed ? <Undo2 className="size-3.5" /> : <Check className="size-3.5" />}
      {pending ? "Menyimpan…" : reviewed ? "Batalkan" : "Sudah benar"}
    </Button>
  )
}
