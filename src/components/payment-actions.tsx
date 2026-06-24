"use client"
import { deletePayment } from "@/app/actions/payments"
import { DeleteActionMenu } from "./delete-action-menu"

export function PaymentActions({ id }: { id: string }) {
  return (
    <DeleteActionMenu 
      id={id} 
      onDelete={deletePayment} 
      title="Hapus Pembayaran?" 
      description="Anda yakin ingin menghapus catatan pembayaran ini? Tindakan ini tidak akan menghapus riwayat arus kas yang terkait secara otomatis."
    />
  )
}
