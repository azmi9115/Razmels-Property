"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BUILDING_TYPES } from "@/lib/building-types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createBuilding } from "@/app/actions/buildings"
import { toast } from "sonner"

const typeOptions = BUILDING_TYPES

export function AddBuildingDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createBuilding(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Unit berhasil ditambahkan!")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "lg" })}>
        <Plus className="h-4 w-4" />
        <span>Tambah Kamar</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Unit</DialogTitle>
          <DialogDescription>
            Kamar, kios, kontrakan, atau apartemen. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Kode / Nama Unit</Label>
            <Input id="code" name="code" placeholder="Misal: BA-8 atau Sky Terrace Lagoon" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipe Bangunan</Label>
            <Select name="type" defaultValue="Kamar">
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent_price">Harga Sewa (Rp)</Label>
            <Input id="rent_price" name="rent_price" type="number" placeholder="Misal: 1500000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent_period">Periode Pembayaran</Label>
            <Select name="rent_period" defaultValue="Bulanan">
              <SelectTrigger>
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bulanan">Bulanan</SelectItem>
                <SelectItem value="Triwulan">Triwulan (3 Bulan)</SelectItem>
                <SelectItem value="Tahunan">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Keterangan <span className="font-normal text-muted-foreground">(opsional)</span></Label>
            <Textarea id="description" name="description" rows={2} placeholder="Misal: Daan Mogot, Jakarta Barat. Sudah termasuk IPL dan parkir." />
            <p className="text-xs text-muted-foreground">Tampil di halaman depan untuk calon penyewa.</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
