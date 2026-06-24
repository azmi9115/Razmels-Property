"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBuilding } from "@/app/actions/buildings"
import { toast } from "sonner"

export function EditBuildingDialog({ 
  building, 
  open, 
  onOpenChange 
}: { 
  building: { id: string, code: string, type: string, rent_price: number, rent_period: string },
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [defaultValues, setDefaultValues] = useState(building)

  useEffect(() => {
    if (open) {
      setDefaultValues(building)
    }
  }, [open, building])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await updateBuilding(building.id, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Kamar berhasil diperbarui!")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Kamar / Properti</DialogTitle>
          <DialogDescription>
            Ubah data properti. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Kode Kamar</Label>
            <Input id="code" name="code" defaultValue={defaultValues.code} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipe Bangunan</Label>
            <Select name="type" defaultValue={defaultValues.type}>
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
            <Input id="rent_price" name="rent_price" type="number" defaultValue={defaultValues.rent_price} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent_period">Periode Pembayaran</Label>
            <Select name="rent_period" defaultValue={defaultValues.rent_period}>
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
            <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
