"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Pencil, Plus } from "lucide-react"
import { checkCashflowDraft, createCashflow, updateCashflow } from "@/app/actions/cashflow"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES = ["Apt Depok", "Apt DM", "Bank", "Kontrakan", "Mesjid 52", "Sedekah", "Wakaf", "Zakat", "Lain-lain"]

type Warning = { rule: string; hint: string; severity: "tinggi" | "sedang" | "rendah" }
export type CashflowInput = { id: string; type: string; category: string; description: string; amount: number; transaction_date: Date | string }

// Tanggal hari ini / tanggal transaksi dalam WIB untuk <input type="date">
const toDateInput = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })

export function AddCashflowDialog() {
  return (
    <CashflowFormDialog
      trigger={
        <DialogTrigger className={buttonVariants({ size: "lg" })}>
          <Plus className="h-4 w-4" />
          <span>Catat Transaksi</span>
        </DialogTrigger>
      }
    />
  )
}

export function EditCashflowDialog({ cashflow }: { cashflow: CashflowInput }) {
  return (
    <CashflowFormDialog
      cashflow={cashflow}
      trigger={
        <DialogTrigger
          aria-label="Ubah transaksi"
          title="Ubah transaksi"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-4" />
        </DialogTrigger>
      }
    />
  )
}

// Form catat/ubah transaksi. Sebelum disimpan, dicek dulu dengan aturan "Perlu dicek":
// kalau ada yang janggal, pemilik bisa memperbaiki atau tetap menyimpan (peringatan dianggap sudah ditinjau).
function CashflowFormDialog({ cashflow, trigger }: { cashflow?: CashflowInput; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [warnings, setWarnings] = useState<Warning[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!cashflow

  function reset(next: boolean) {
    setOpen(next)
    if (!next) setWarnings([])
  }

  async function save(formData: FormData, acknowledged: string[]) {
    const result = cashflow ? await updateCashflow(cashflow.id, formData, acknowledged) : await createCashflow(formData, acknowledged)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(isEdit ? "Transaksi berhasil diubah!" : "Transaksi berhasil dicatat!")
    reset(false)
    if (!isEdit) formRef.current?.reset()
  }

  // onSubmit (bukan <form action>) supaya isian tidak dikosongkan otomatis oleh React
  // saat peringatan ditampilkan — pemilik masih perlu "Perbaiki dulu" atau "Tetap simpan"
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    try {
      const { warnings: found } = await checkCashflowDraft(formData, cashflow?.id)
      if (found.length > 0) {
        setWarnings(found)
        return
      }
      await save(formData, [])
    } finally {
      setLoading(false)
    }
  }

  async function saveAnyway() {
    if (!formRef.current) return
    setLoading(true)
    try {
      await save(new FormData(formRef.current), warnings.map((w) => w.rule))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      {trigger}
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Transaksi" : "Catat Transaksi Manual"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbaiki tipe, kategori, deskripsi, atau nominal transaksi ini." : "Masukkan detail pengeluaran atau pemasukan lainnya."}
          </DialogDescription>
        </DialogHeader>
        {/* Mengubah isian menghapus peringatan lama — dicek ulang saat disimpan */}
        <form ref={formRef} onSubmit={handleSubmit} onChange={() => warnings.length > 0 && setWarnings([])} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Transaksi</Label>
              <Select name="type" defaultValue={cashflow?.type ?? "Pengeluaran"} onValueChange={() => setWarnings([])}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Tanggal</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                defaultValue={toDateInput(cashflow?.transaction_date ?? new Date())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select name="category" defaultValue={cashflow?.category ?? "Kontrakan"} onValueChange={() => setWarnings([])}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {/* Kategori lama yang tidak ada di daftar tetap bisa dipertahankan saat mengubah */}
                {[...new Set([...CATEGORIES, ...(cashflow ? [cashflow.category] : [])])].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input id="description" name="description" placeholder="Cth: Bayar token listrik bulan ini" required defaultValue={cashflow?.description} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Nominal (Rp)</Label>
            <Input id="amount" name="amount" type="number" min="0" placeholder="Misal: 150000" required defaultValue={cashflow?.amount} />
          </div>

          {warnings.length > 0 && (
            <div role="alert" className="space-y-2 rounded-xl border border-warning/40 bg-warning-soft p-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                <AlertTriangle className="size-4" /> Cek dulu sebelum disimpan
              </p>
              <ul className="space-y-1.5 text-[13px]">
                {warnings.map((w) => (
                  <li key={w.rule}>
                    <span className={cn("font-medium", w.severity === "tinggi" && "text-danger")}>{w.rule}.</span>{" "}
                    <span className="text-muted-foreground">{w.hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {warnings.length > 0 ? (
              <>
                <Button type="button" variant="outline" onClick={() => setWarnings([])} disabled={loading}>
                  Perbaiki dulu
                </Button>
                <Button type="button" onClick={saveAnyway} disabled={loading}>
                  {loading ? "Menyimpan..." : "Sudah benar, tetap simpan"}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? "Memeriksa..." : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
