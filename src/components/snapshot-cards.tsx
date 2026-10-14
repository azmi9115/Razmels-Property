"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowDownRight, ArrowUpRight, Coins, Landmark, Pencil, PiggyBank } from "lucide-react"
import { updateSnapshot } from "@/app/actions/snapshot"
import { toast } from "sonner"
import { formatDate, formatRupiah } from "@/lib/format"

type Snapshot = {
  total_tabungan: number
  total_investasi: number
  updated_at: Date | string
} | null

export function SnapshotCards({
  snapshot,
  finalBalance,
  totalIncome,
  totalExpense,
}: {
  snapshot: Snapshot
  finalBalance: number
  totalIncome: number
  totalExpense: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const tabungan = finalBalance
  const investasi = snapshot?.total_investasi || 0
  const rekening = tabungan + investasi
  const lastUpdated = snapshot?.updated_at ? formatDate(snapshot.updated_at) : "belum pernah"

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const res = await updateSnapshot(formData)
    setLoading(false)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Data keuangan berhasil diperbarui")
      setOpen(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {/* Total aset — kartu utama */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-navy p-6 text-white xl:col-span-2">
        <div className="grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-300/90 uppercase">Total aset</p>
              <p className="mt-1 text-xs text-white/50">Saldo kas + investasi · diperbarui {lastUpdated}</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={<Button size="sm" variant="ghost" className="h-8 gap-1.5 bg-white/10 px-2.5 text-xs text-white hover:bg-white/15 hover:text-white" />}
              >
                <Pencil className="size-3" /> Ubah investasi
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Perbarui saldo aktual</DialogTitle>
                  <DialogDescription>Tabungan dihitung otomatis dari saldo akhir buku besar. Isi total investasi terbaru.</DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tabungan (otomatis)</Label>
                    <Input type="text" value={formatRupiah(tabungan)} disabled />
                    <Input name="total_tabungan" type="hidden" value={snapshot?.total_tabungan || 0} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_investasi">Total investasi (Rp)</Label>
                    <Input id="total_investasi" name="total_investasi" type="number" defaultValue={investasi} required />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button type="submit" size="lg" disabled={loading}>
                      {loading ? "Menyimpan…" : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <p className="mt-5 text-3xl font-bold tracking-tight whitespace-nowrap sm:text-4xl">{formatRupiah(rekening)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 text-xs text-white/60"><PiggyBank className="size-3.5" /> Tabungan</p>
              <p className="mt-1 font-semibold">{formatRupiah(tabungan)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 text-xs text-white/60"><Coins className="size-3.5" /> Investasi</p>
              <p className="mt-1 font-semibold">{formatRupiah(investasi)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3 xl:grid-cols-1">
        <Tile label="Total pemasukan" value={formatRupiah(totalIncome)} icon={ArrowUpRight} className="bg-success-soft text-success" />
        <Tile label="Total pengeluaran" value={formatRupiah(totalExpense)} icon={ArrowDownRight} className="bg-danger-soft text-danger" />
        <Tile label="Saldo akhir" value={formatRupiah(finalBalance)} icon={Landmark} className="bg-info-soft text-info" />
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}) {
  return (
    <div className="surface flex items-center gap-4 p-5">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${className}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="mt-1 truncate text-xl font-bold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  )
}
