"use client"
import { deleteCashflow } from "@/app/actions/cashflow"
import { DeleteActionMenu } from "./delete-action-menu"
import { EditCashflowDialog, type CashflowInput } from "./add-cashflow-dialog"

export function CashflowActions({ cashflow }: { cashflow: CashflowInput }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <EditCashflowDialog cashflow={cashflow} />
      <DeleteActionMenu
        id={cashflow.id}
        onDelete={deleteCashflow}
        title="Hapus Transaksi?"
        description="Catatan transaksi ini akan dihapus dari buku besar. Saldo total akan otomatis menyesuaikan."
      />
    </div>
  )
}
