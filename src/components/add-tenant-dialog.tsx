"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createTenant } from "@/app/actions/tenants"
import { toast } from "sonner"

export function AddTenantDialog({ availableBuildings }: { availableBuildings: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    
    const fileInput = document.getElementById("id_card_file") as HTMLInputElement;
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

    const result = await createTenant(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Penghuni berhasil ditambahkan!")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm">
        <Plus className="h-4 w-4" />
        <span>Tambah Penghuni</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Penghuni Baru</DialogTitle>
          <DialogDescription>
            Isi data diri penghuni dan pilih kamar yang tersedia.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK KTP</Label>
              <Input id="nik" name="nik" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_1">No. HP Utama</Label>
              <Input id="phone_1" name="phone_1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_2">No. HP Alternatif</Label>
              <Input id="phone_2" name="phone_2" placeholder="Opsional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Kontak Darurat</Label>
              <Input id="emergency_contact" name="emergency_contact" placeholder="Nama & No HP (Opsional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_card_file">Foto KTP / Identitas</Label>
              <Input id="id_card_file" type="file" accept="image/*,.pdf" className="cursor-pointer file:cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Tanggal Masuk</Label>
              <Input id="entry_date" name="entry_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_id">Pilih Kamar</Label>
              <Select name="building_id">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kamar" />
                </SelectTrigger>
                <SelectContent>
                  {availableBuildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.code} ({b.type})</SelectItem>
                  ))}
                  {availableBuildings.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">Semua kamar penuh.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
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
