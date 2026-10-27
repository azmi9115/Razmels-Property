"use client"

import { Check, Clock3, Minus, X } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { formatDate, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

type Row = {
  id: string
  name: string
  room: string
  masaSewa: string
  tglMasuk: Date
  akhirSewa: Date | null
  currentStatus: string
  statusPerMonth: string[]
}

const STATUS = {
  TEPAT: { label: "Tepat waktu", icon: Check, cell: "bg-success text-white dark:text-emerald-950", pill: "bg-success-soft text-success" },
  TELAT: { label: "Telat (lewat tgl masuk)", icon: Clock3, cell: "bg-warning text-white dark:text-amber-950", pill: "bg-warning-soft text-warning" },
  "BELUM BAYAR": { label: "Belum bayar", icon: X, cell: "bg-danger text-white dark:text-red-950", pill: "bg-danger-soft text-danger" },
  KOSONG: { label: "Belum menghuni", icon: Minus, cell: "bg-muted text-muted-foreground/50", pill: "bg-muted text-muted-foreground" },
  "—": { label: "Belum jatuh tempo", icon: Minus, cell: "bg-muted/60 text-muted-foreground/40", pill: "bg-muted text-muted-foreground" },
} as const

type StatusKey = keyof typeof STATUS

function statusOf(s: string) {
  return STATUS[(s in STATUS ? s : "—") as StatusKey]
}

export function MonitoringLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {(["TEPAT", "TELAT", "BELUM BAYAR", "KOSONG"] as StatusKey[]).map((k) => {
        const s = STATUS[k]
        return (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("flex size-5 items-center justify-center rounded-md", s.cell)}>
              <s.icon className="size-3" strokeWidth={3} />
            </span>
            {s.label}
          </span>
        )
      })}
    </div>
  )
}

export function MonitoringGrid({ rows, months, currentMonth }: { rows: Row[]; months: string[]; currentMonth: string }) {
  const today = new Date()
  if (rows.length === 0) {
    return (
      <section className="surface">
        <EmptyState title="Tidak ada penghuni aktif" description="Monitoring akan muncul setelah ada penghuni aktif." />
      </section>
    )
  }

  return (
    <section className="surface overflow-hidden">
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-20 min-w-[220px] border-b bg-muted/95 px-4 py-3 text-left text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur">
                Penghuni
              </th>
              <th className="border-b px-3 py-3 text-center text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase">
                Bulan ini
                <span className="block font-normal tracking-normal normal-case">{currentMonth}</span>
              </th>
              <th className="border-b px-3 py-3 text-center text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                Ketepatan
              </th>
              {months.map((month) => (
                <th key={month} className="border-b px-1.5 py-3 text-center text-[11px] font-semibold whitespace-nowrap text-muted-foreground">
                  {month}
                </th>
              ))}
              <th className="border-b px-4 py-3 text-left text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase">
                Masa sewa
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const current = statusOf(row.currentStatus)
              const counted = row.statusPerMonth.filter((s) => s === "TEPAT" || s === "TELAT" || s === "BELUM BAYAR")
              const onTime = counted.filter((s) => s === "TEPAT").length
              const score = counted.length > 0 ? Math.round((onTime / counted.length) * 100) : null
              const entry = new Date(row.tglMasuk)
              const isNew = entry.getFullYear() === today.getFullYear() && entry.getMonth() === today.getMonth()
              return (
                <tr key={row.id} className="group">
                  <td className="sticky left-0 z-10 border-b bg-card px-4 py-2.5 transition-colors group-hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-[11px] font-bold text-muted-foreground">
                        {initials(row.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[150px] truncate font-semibold" title={row.name}>{row.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{row.room}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b px-3 py-2.5 text-center transition-colors group-hover:bg-muted/50">
                    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", current.pill)}>
                      <current.icon className="size-3" strokeWidth={3} />
                      {row.currentStatus === "—" ? "Belum tempo" : current.label.replace(" (lewat tgl masuk)", "")}
                    </span>
                    {isNew && <p className="mt-1 text-[11px] text-muted-foreground">Baru masuk {formatDate(row.tglMasuk)}</p>}
                  </td>
                  <td className="border-b px-3 py-2.5 transition-colors group-hover:bg-muted/50">
                    {score === null ? (
                      <span className="block text-center text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="mx-auto flex w-24 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger")}
                            style={{ width: `${Math.max(4, score)}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold tabular-nums">{score}%</span>
                      </div>
                    )}
                  </td>
                  {row.statusPerMonth.map((status, j) => {
                    const s = statusOf(status)
                    return (
                      <td key={j} className="border-b px-1 py-2.5 text-center transition-colors group-hover:bg-muted/50">
                        <span
                          title={`${months[j]} · ${s.label}`}
                          className={cn("mx-auto flex size-7 items-center justify-center rounded-lg transition-transform hover:scale-110", s.cell)}
                        >
                          <s.icon className="size-3.5" strokeWidth={3} />
                        </span>
                      </td>
                    )
                  })}
                  <td className="border-b px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground transition-colors group-hover:bg-muted/50">
                    <span className="tabular-nums">{formatDate(row.tglMasuk)}</span>
                    <span className="mx-1.5">→</span>
                    <span className="font-medium text-foreground tabular-nums">{row.akhirSewa ? formatDate(row.akhirSewa) : "—"}</span>
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px]">{row.masaSewa}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-muted-foreground">
        <span>
          {rows.length} penghuni aktif · {months.length} bulan terakhir (terbaru di kiri)
        </span>
        <span>Ketepatan = bulan bayar tepat waktu ÷ bulan yang sudah jatuh tempo</span>
      </div>
    </section>
  )
}
