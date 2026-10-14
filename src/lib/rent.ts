// Status jatuh tempo penghuni — dipakai Dashboard, Daftar Penghuni, dan Cash Flow.
// Jatuh tempo = rent_end_date pembayaran terakhir, atau entry_date kalau belum pernah bayar.

const DAY_MS = 1000 * 60 * 60 * 24

export type DueState = "late" | "soon" | "ok" | "inactive"

export type DueInfo = {
  dueDate: Date
  diffDays: number
  state: DueState
}

export function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function getDueInfo(
  tenant: { entry_date: Date; status: string; payments: { rent_end_date: Date }[] },
  today: Date = startOfToday()
): DueInfo {
  // payments diharapkan sudah diurutkan rent_end_date desc (take: 1)
  const dueDate = new Date(tenant.payments.length > 0 ? tenant.payments[0].rent_end_date : tenant.entry_date)
  dueDate.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS)

  let state: DueState = "ok"
  if (tenant.status !== "Active") state = "inactive"
  else if (diffDays < 0) state = "late"
  else if (diffDays <= 7) state = "soon"

  return { dueDate, diffDays, state }
}

export function dueLabel(info: DueInfo): string {
  if (info.state === "inactive") return "Sudah keluar"
  if (info.diffDays < 0) return `Telat ${Math.abs(info.diffDays)} hari`
  if (info.diffDays === 0) return "Jatuh tempo hari ini"
  return `${info.diffDays} hari lagi`
}
