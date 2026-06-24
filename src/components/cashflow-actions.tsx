"use client"
import { deleteCashflow } from "@/app/actions/cashflow"
import { DeleteActionMenu } from "./delete-action-menu"

export function CashflowActions({ id }: { id: string }) {
  return (
    <DeleteActionMenu 
      id={id} 
      onDelete={deleteCashflow} 
      title="Hapus Transaksi?" 
      description="Catatan transaksi ini akan dihapus dari buku besar. Saldo total akan otomatis menyesuaikan."
    />
  )
}
