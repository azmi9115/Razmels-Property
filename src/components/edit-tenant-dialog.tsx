"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTenant } from "@/app/actions/tenants"
import { toast } from "sonner"

export function EditTenantDialog({ 
  tenant, 
  availableBuildings,
  open, 
  onOpenChange 
}: { 
  tenant: any,
  availableBuildings: any[],
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [defaultValues, setDefaultValues] = useState(tenant)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(tenant.building_id || undefined)

  // Freeze default values when opening the dialog to prevent Base UI warnings
  // about changing uncontrolled input values after initialization
  useEffect(() => {
    if (open) {
      setDefaultValues(tenant)
    }
  }, [open, tenant])

  async function handleSubmit(formData: FormData) {
    setLoading(true)

    const fileInput = document.getElementById("edit_id_card_file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (file) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      if (data.url) {
        formData.append("id_card_url", data.url);
      }
    }

    const result = await updateTenant(tenant.id, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Penghuni berhasil diperbarui!")
      onOpenChange(false)
    }
  }

  // Format date to YYYY-MM-DD for input default value
  const entryDateRaw = new Date(defaultValues.entry_date)
  const entryDateFormatted = !isNaN(entryDateRaw.getTime()) 
    ? entryDateRaw.toISOString().split('T')[0] 
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Penghuni</DialogTitle>
          <DialogDescription>
            Ubah data diri penghuni. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" defaultValue={defaultValues.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK KTP</Label>
              <Input id="nik" name="nik" defaultValue={defaultValues.nik} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_1">No. HP Utama</Label>
              <Input id="phone_1" name="phone_1" defaultValue={defaultValues.phone_1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_2">No. HP Alternatif</Label>
              <Input id="phone_2" name="phone_2" defaultValue={defaultValues.phone_2 || ""} placeholder="Opsional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Kontak Darurat</Label>
              <Input id="emergency_contact" name="emergency_contact" defaultValue={defaultValues.emergency_contact || ""} placeholder="Nama & No HP (Opsional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_id_card_file">Ubah Foto KTP (Opsional)</Label>
              <Input id="edit_id_card_file" type="file" accept="image/*,.pdf" className="cursor-pointer file:cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Tanggal Masuk</Label>
              <Input id="entry_date" name="entry_date" type="date" defaultValue={entryDateFormatted} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_id">Pilih Kamar</Label>
              <input type="hidden" name="building_id" value={selectedBuildingId || ""} />
              <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                <SelectTrigger>
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {selectedBuildingId
                      ? (selectedBuildingId === defaultValues.building_id && defaultValues.building
                          ? `${defaultValues.building.code} (${defaultValues.building.type})`
                          : (() => {
                              const b = availableBuildings.find(b => b.id === selectedBuildingId);
                              return b ? `${b.code} (${b.type})` : selectedBuildingId;
                            })()
                        )
                      : "Pilih Kamar"
                    }
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {defaultValues.building && (
                    <SelectItem value={defaultValues.building_id}>{defaultValues.building.code} ({defaultValues.building.type})</SelectItem>
                  )}
                  {availableBuildings.map((b) => (
                    b.id !== defaultValues.building_id && (
                      <SelectItem key={b.id} value={b.id}>{b.code} ({b.type})</SelectItem>
                    )
                  ))}
                  {availableBuildings.length === 0 && !defaultValues.building && (
                    <div className="p-2 text-sm text-muted-foreground">Semua kamar penuh.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
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
