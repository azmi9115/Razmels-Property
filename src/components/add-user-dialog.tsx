"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { createUser } from "@/app/actions/users"
import { toast } from "sonner"

export function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.set("role", selectedRole)
    const result = await createUser(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Akun staf berhasil dibuat!")
      setOpen(false)
      setSelectedRole("ADMIN")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm">
        <UserPlus className="h-4 w-4" />
        <span>Tambah Akun Staf</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Akun Staf Baru</DialogTitle>
          <DialogDescription>
            Buat akun login untuk pengelola properti Anda.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" placeholder="Contoh: Budi Santoso" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Alamat Email</Label>
            <Input id="email" name="email" type="email" placeholder="staf@razmels.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 8 karakter" required />
          </div>
          <div className="space-y-2">
            <Label>Role / Jabatan</Label>
            <Select value={selectedRole} onValueChange={(val) => val && setSelectedRole(val)}>
              <SelectTrigger>
                <span data-slot="select-value" className="flex flex-1 text-left">
                  {selectedRole === "OWNER" ? "Owner (Pemilik)" : "Admin (Staf)"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin (Staf) — Akses terbatas</SelectItem>
                <SelectItem value="OWNER">Owner (Pemilik) — Akses penuh</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admin hanya bisa akses Bangunan, Penghuni & Pembayaran.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Membuat Akun..." : "Buat Akun"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
