"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createPayment } from "@/app/actions/payments"
import { toast } from "sonner"

export function AddPaymentDialog({ activeTenants }: { activeTenants: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [durationMonths, setDurationMonths] = useState<number>(1)
  const [amount, setAmount] = useState<number>(0)
  const [isOverride, setIsOverride] = useState<boolean>(false)

  // Auto-calculate amount based on tenant's building rent_price and duration
  const handleTenantChange = (tenantId: string | null) => {
    if (!tenantId) return;
    setSelectedTenantId(tenantId)
    const tenant = activeTenants.find(t => t.id === tenantId)
    if (tenant?.building) {
      setAmount(tenant.building.rent_price * durationMonths)
    } else {
      setAmount(0)
    }
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const months = Number(e.target.value) || 1
    setDurationMonths(months)
    const tenant = activeTenants.find(t => t.id === selectedTenantId)
    if (tenant?.building) {
      setAmount(tenant.building.rent_price * months)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    // override amount with our state in case it's disabled in form
    formData.set("amount", amount.toString())
    
    const result = await createPayment(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Pembayaran berhasil dicatat & masuk ke Cashflow!")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) {
        // Reset semua state saat dialog ditutup
        setSelectedTenantId("")
        setDurationMonths(1)
        setAmount(0)
        setIsOverride(false)
      }
    }}>
      <DialogTrigger className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm">
        <Plus className="h-4 w-4" />
        <span>Catat Pembayaran</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Input Pembayaran Sewa</DialogTitle>
          <DialogDescription>
            Catat pembayaran sewa. Tanggal jatuh tempo akan dihitung otomatis.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_id">Pilih Penghuni</Label>
            <input type="hidden" name="tenant_id" value={selectedTenantId} />
            <Select value={selectedTenantId} onValueChange={handleTenantChange}>
              <SelectTrigger>
                <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                  {selectedTenantId
                    ? (() => {
                        const t = activeTenants.find(t => t.id === selectedTenantId)
                        return t ? `${t.name} — ${t.building?.code || "Tanpa Kamar"}` : "Pilih Penghuni Aktif"
                      })()
                    : "Pilih Penghuni Aktif"
                  }
                </span>
              </SelectTrigger>
              <SelectContent>
                {activeTenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — {t.building?.code || "Tanpa Kamar"}
                  </SelectItem>
                ))}
                {activeTenants.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">Tidak ada penghuni aktif.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer_date">Tanggal Pembayaran</Label>
              <Input id="transfer_date" name="transfer_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent_duration_months">Durasi Sewa (Bulan)</Label>
              <Input id="rent_duration_months" name="rent_duration_months" type="number" min="1" value={durationMonths} onChange={handleDurationChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Nominal yang Dibayar (Rp)</Label>
              <button
                type="button"
                onClick={() => setIsOverride(!isOverride)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isOverride ? "bg-amber-100 text-amber-700 border-amber-300" : "text-slate-500 border-slate-200 hover:border-slate-300"}`}
              >
                {isOverride ? "✏️ Manual" : "Override Harga"}
              </button>
            </div>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={isOverride ? (e) => setAmount(Number(e.target.value)) : undefined}
              readOnly={!isOverride}
              className={`font-bold text-emerald-600 focus-visible:ring-0 ${isOverride ? "bg-white border-amber-300" : "bg-slate-50"}`}
            />
            <p className="text-xs text-muted-foreground">
              {isOverride ? "⚠️ Mode manual: Anda mengatur sendiri nominalnya." : "Otomatis dihitung dari harga kamar x durasi sewa."}
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Catat Pembayaran"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
