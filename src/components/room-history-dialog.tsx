"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { addRoomHistory, deleteRoomHistory } from "@/app/actions/room-history"
import { toast } from "sonner"
import { History, Trash2, Plus } from "lucide-react"

type Building = { id: string; code: string; type: string }
type RoomHistoryItem = {
  id: string
  building: Building | null
  moved_in: Date
  moved_out: Date | null
  notes: string | null
}

export function RoomHistoryDialog({
  tenantId,
  tenantName,
  buildings,
  histories,
  open,
  onOpenChange
}: {
  tenantId: string
  tenantName: string
  buildings: Building[]
  histories: RoomHistoryItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState("")

  async function handleAdd(formData: FormData) {
    setLoading(true)
    formData.set("tenant_id", tenantId)
    formData.set("building_id", selectedBuilding)
    const result = await addRoomHistory(formData)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Riwayat kamar ditambahkan!")
      setShowForm(false)
      setSelectedBuilding("")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus riwayat kamar ini?")) return
    const result = await deleteRoomHistory(id)
    if (result.error) toast.error(result.error)
    else toast.success("Riwayat dihapus!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Riwayat Kamar — {tenantName}
          </DialogTitle>
          <DialogDescription>
            Daftar kamar yang pernah dihuni (Kode Bangunan 2, 3, dst.)
          </DialogDescription>
        </DialogHeader>

        {/* Existing histories */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {histories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat kamar tercatat.</p>
          )}
          {histories.map(h => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md shrink-0">
                {h.building?.code || "—"}
              </span>
              <div className="flex-1 text-xs text-slate-600">
                <span>{new Date(h.moved_in).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="mx-1">→</span>
                <span>{h.moved_out ? new Date(h.moved_out).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Sekarang"}</span>
                {h.notes && <span className="ml-2 text-slate-400">({h.notes})</span>}
              </div>
              <button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm ? (
          <form action={handleAdd} className="space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Kamar</Label>
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                <SelectTrigger>
                  <span data-slot="select-value" className="flex flex-1 text-left">
                    {selectedBuilding
                      ? buildings.find(b => b.id === selectedBuilding)?.code || "Pilih Kamar"
                      : "Pilih Kamar"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.code} ({b.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tgl Masuk</Label>
                <Input name="moved_in" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label>Tgl Keluar</Label>
                <Input name="moved_out" type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (Opsional)</Label>
              <Input name="notes" placeholder="Cth: Pindah dari kamar lama" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Batal</Button>
              <Button type="submit" size="sm" disabled={loading || !selectedBuilding}>
                {loading ? "Menyimpan..." : "Tambah Riwayat"}
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Tambah Riwayat Kamar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
