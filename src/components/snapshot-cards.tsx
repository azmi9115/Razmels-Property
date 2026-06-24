"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Landmark, PiggyBank, Coins, Edit3 } from "lucide-react"
import { updateSnapshot } from "@/app/actions/snapshot"
import { toast } from "sonner"

export function SnapshotCards({ snapshot, finalBalance }: { snapshot: any; finalBalance: number }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const tabungan = finalBalance
  const investasi = snapshot?.total_investasi || 0
  const rekening = tabungan + investasi
  const lastUpdated = snapshot?.updated_at ? new Date(snapshot.updated_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "Belum diupdate"

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aset & Saldo Aktual</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Update: {lastUpdated}</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5" />}>
              <Edit3 className="h-3 w-3" /> Update Saldo
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Update Saldo Aktual</DialogTitle>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Total Tabungan (Otomatis dari Saldo Akhir)</Label>
                  <Input type="text" value={`Rp ${tabungan.toLocaleString("id-ID")}`} disabled className="bg-slate-50" />
                  <Input name="total_tabungan" type="hidden" value={snapshot?.total_tabungan || 0} />
                </div>
                <div className="space-y-2">
                  <Label>Total Investasi (Rp)</Label>
                  <Input name="total_investasi" type="number" defaultValue={investasi} required />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <PiggyBank className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tabungan</p>
              <p className="text-lg font-bold text-indigo-900">Rp {tabungan.toLocaleString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investasi</p>
              <p className="text-lg font-bold text-emerald-900">Rp {investasi.toLocaleString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rekening</p>
              <p className="text-lg font-bold text-blue-900">Rp {rekening.toLocaleString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
