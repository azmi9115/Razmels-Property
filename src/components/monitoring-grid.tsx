"use client"

import { Card, CardContent } from "@/components/ui/card"

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

function StatusBadge({ status }: { status: string }) {
  if (status === "TEPAT") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">TEPAT</span>
      </div>
    )
  }
  if (status === "TELAT") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">TELAT</span>
      </div>
    )
  }
  if (status === "BELUM BAYAR") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">BELUM</span>
      </div>
    )
  }
  if (status === "KOSONG") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] text-slate-400">—</span>
      </div>
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-[10px] text-slate-300">—</span>
    </div>
  )
}

function CurrentStatusBadge({ status }: { status: string }) {
  const base = "text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
  if (status === "TEPAT") return <span className={`${base} text-emerald-700 bg-emerald-100`}>TEPAT</span>
  if (status === "TELAT") return <span className={`${base} text-amber-700 bg-amber-100`}>TELAT</span>
  return <span className={`${base} text-red-700 bg-red-100`}>BELUM BAYAR</span>
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

export function MonitoringGrid({ rows, months }: { rows: Row[]; months: string[] }) {
  if (rows.length === 0) {
    return (
      <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl">
        <CardContent className="py-16 text-center text-muted-foreground">
          Tidak ada penghuni aktif saat ini.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {/* Sticky fixed columns */}
                <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[140px]">
                  Penghuni
                </th>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider sticky left-[140px] bg-slate-50 z-10 min-w-[65px]">
                  Kamar
                </th>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider min-w-[80px]">
                  Masa Sewa
                </th>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider min-w-[105px]">
                  Tgl Masuk
                </th>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider min-w-[105px]">
                  Akhir Sewa
                </th>
                <th className="text-center py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider min-w-[90px]">
                  Status Bln Ini
                </th>
                {/* Month columns */}
                {months.map((month) => (
                  <th
                    key={month}
                    className="py-3 px-2 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center min-w-[70px]"
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, i) => {
                const bg = i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                const stickyBg = i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                return (
                  <tr key={row.id} className={`hover:bg-indigo-50/30 transition-colors ${bg}`}>
                    <td className={`py-3 px-4 font-semibold text-slate-800 sticky left-0 z-10 text-sm ${stickyBg}`}>
                      <span className="truncate block max-w-[130px]" title={row.name}>{row.name}</span>
                    </td>
                    <td className={`py-3 px-3 sticky left-[140px] z-10 ${stickyBg}`}>
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md">
                        {row.room}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 font-medium">{row.masaSewa}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{fmtDate(row.tglMasuk)}</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{fmtDate(row.akhirSewa)}</td>
                    <td className="py-3 px-3 text-center">
                      <CurrentStatusBadge status={row.currentStatus} />
                    </td>
                    {row.statusPerMonth.map((status, j) => (
                      <td key={j} className="py-2 px-1 text-center h-10">
                        <StatusBadge status={status} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Total penghuni aktif: <strong className="text-slate-700">{rows.length}</strong></span>
          <span>•</span>
          <span>Menampilkan <strong className="text-slate-700">{months.length} bulan</strong> terakhir</span>
        </div>
      </CardContent>
    </Card>
  )
}
