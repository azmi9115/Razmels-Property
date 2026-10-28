"use client"

import { useTransition } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { deleteGroupRule, teachGroup } from "@/app/actions/group-rules"
import { cn } from "@/lib/utils"

// Pilih kelompok untuk satu transaksi — sistem mengingatnya untuk transaksi serupa berikutnya
export function GroupPicker({ type, description, current, options }: { type: string; description: string; current: string; options: string[] }) {
  const [pending, startTransition] = useTransition()

  function handleChange(group: string) {
    if (group === current) return
    startTransition(async () => {
      const res = await teachGroup(type, description, group)
      if (res.error) toast.error(res.error)
      else toast.success(`Diingat: "${description}" → ${group}`)
    })
  }

  return (
    <select
      aria-label={`Kelompok untuk ${description}`}
      title="Pindahkan ke kelompok lain — sistem akan mengingatnya"
      value={current}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        "h-7 max-w-40 shrink-0 cursor-pointer rounded-md border bg-card px-1.5 text-xs text-muted-foreground outline-none hover:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring",
        pending && "opacity-50"
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

export function DeleteRuleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      aria-label="Hapus ajaran"
      title="Hapus ajaran ini — kembali ke aturan bawaan"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteGroupRule(id)
          if (res.error) toast.error(res.error)
          else toast.success("Ajaran dihapus")
        })
      }
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  )
}
