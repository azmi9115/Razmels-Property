import { PageHeader } from "@/components/page-header"
import { ExcelSyncClient } from "@/components/excel-sync-client"

export const dynamic = "force-dynamic"

export default function UpdateExcelPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Masa transisi"
        title="Update dari Excel"
        description="Selama pencatatan harian masih di Excel manager ops: upload file terbarunya, cek perbedaannya dengan data web, lalu verifikasi sebelum data web diperbarui."
      />
      <ExcelSyncClient />
    </div>
  )
}
