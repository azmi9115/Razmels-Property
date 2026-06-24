"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createBuilding } from "@/app/actions/buildings"
import { toast } from "sonner"

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
      toast.success("Kamar berhasil ditambahkan!")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm">
        <Plus className="h-4 w-4" />
        <span>Tambah Kamar</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Kamar / Properti</DialogTitle>
          <DialogDescription>
            Masukkan data properti baru. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Kode Kamar</Label>
            <Input id="code" name="code" placeholder="Misal: A01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipe Bangunan</Label>
            <Select name="type" defaultValue="Kosan">
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kosan">Kosan</SelectItem>
                <SelectItem value="Kontrakan">Kontrakan</SelectItem>
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
