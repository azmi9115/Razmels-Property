"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, LogOut, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteTenant, checkoutTenant } from "@/app/actions/tenants"
import { toast } from "sonner"
import { EditTenantDialog } from "./edit-tenant-dialog"
import { RoomHistoryDialog } from "./room-history-dialog"
import { getRoomHistories } from "@/app/actions/room-history"

export function TenantActions({ tenant, availableBuildings, isActive }: { tenant: any, availableBuildings: any[], isActive: boolean }) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showCheckoutAlert, setShowCheckoutAlert] = useState(false)
  const [showRoomHistory, setShowRoomHistory] = useState(false)
  const [roomHistories, setRoomHistories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function handleOpenRoomHistory() {
    const data = await getRoomHistories(tenant.id)
    setRoomHistories(data)
    setShowRoomHistory(true)
  }

  async function handleDelete() {
    setLoading(true)
    const res = await deleteTenant(tenant.id)
    setLoading(false)
    setShowDeleteAlert(false)
    if (res.error) toast.error(res.error)
    else toast.success("Data penghuni berhasil dihapus!")
  }

  async function handleCheckout() {
    setLoading(true)
    const res = await checkoutTenant(tenant.id)
    setLoading(false)
    setShowCheckoutAlert(false)
    if (res.error) toast.error(res.error)
    else toast.success("Penghuni berhasil di-checkout. Kamar sekarang tersedia.")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
          <span className="sr-only">Buka menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenRoomHistory}>
              <History className="mr-2 h-4 w-4" /> Riwayat Kamar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isActive && (
              <DropdownMenuItem 
                onClick={() => setShowCheckoutAlert(true)}
              >
                <LogOut className="mr-2 h-4 w-4" /> Check-Out
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Penghuni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus data penghuni beserta riwayat yang terkait dengannya secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCheckoutAlert} onOpenChange={setShowCheckoutAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proses Check-out Penghuni?</AlertDialogTitle>
            <AlertDialogDescription>
              Penghuni ini akan ditandai sebagai "Tidak Aktif" dan kamar yang ditempatinya akan kembali menjadi "Tersedia".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button onClick={handleCheckout} disabled={loading}>Konfirmasi Check-out</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTenantDialog 
        tenant={tenant}
        availableBuildings={availableBuildings}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <RoomHistoryDialog
        tenantId={tenant.id}
        tenantName={tenant.name}
        buildings={availableBuildings}
        histories={roomHistories}
        open={showRoomHistory}
        onOpenChange={setShowRoomHistory}
      />
    </>
  )
}
