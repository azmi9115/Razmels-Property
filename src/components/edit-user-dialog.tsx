"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUser, deleteUser } from "@/app/actions/users"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  role: string
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [values, setValues] = useState(user)
  const [selectedRole, setSelectedRole] = useState(user.role)

  useEffect(() => {
    if (open) {
      setValues(user)
      setSelectedRole(user.role)
    }
  }, [open, user])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.set("role", selectedRole)
    const result = await updateUser(user.id, formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Akun berhasil diperbarui!")
      onOpenChange(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Hapus akun "${user.name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setDeleting(true)
    const result = await deleteUser(user.id)
    setDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Akun berhasil dihapus!")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Akun Staf</DialogTitle>
          <DialogDescription>Perbarui data atau hapus akun pengguna ini.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input
              id="edit-name"
              name="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Alamat Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">Password Baru (Opsional)</Label>
            <Input
              id="edit-password"
              name="password"
              type="password"
              placeholder="Kosongkan jika tidak ingin mengubah"
            />
          </div>
          <div className="space-y-2">
            <Label>Role / Jabatan</Label>
            <Select value={selectedRole} onValueChange={(val) => val && setSelectedRole(val)} disabled={user.role === "OWNER"}>
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
            {user.role === "OWNER" && (
              <p className="text-xs text-amber-600">Role Owner tidak dapat diubah.</p>
            )}
          </div>
          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting || user.role === "OWNER"}
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Menghapus..." : "Hapus Akun"}
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
