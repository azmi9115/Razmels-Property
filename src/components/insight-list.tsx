import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, Info, TrendingDown } from "lucide-react"
import type { Insight } from "@/lib/insights"
import type { Tone } from "@/components/status-pill"
import { cn } from "@/lib/utils"

const toneStyle: Record<Tone, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  success: { icon: CheckCircle2, className: "bg-success-soft text-success" },
  info: { icon: Info, className: "bg-info-soft text-info" },
  warning: { icon: TrendingDown, className: "bg-warning-soft text-warning" },
  danger: { icon: AlertTriangle, className: "bg-danger-soft text-danger" },
  neutral: { icon: Info, className: "bg-muted text-muted-foreground" },
}

const priority: Record<Tone, number> = { danger: 0, warning: 1, info: 2, success: 2, neutral: 3 }

// Daftar kesimpulan otomatis — dipakai di Dashboard & Transparansi Keuangan
export function InsightList({ insights, limit }: { insights: Insight[]; limit?: number }) {
  // Kalau dibatasi (Dashboard), tampilkan yang paling butuh perhatian dulu
  const shown = limit ? [...insights].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || priority[a.tone] - priority[b.tone]).slice(0, limit) : insights
  return (
    <ul className="grid gap-2.5 lg:grid-cols-2">
      {shown.map((ins) => {
        const t = toneStyle[ins.tone]
        const body = (
          <div className="flex h-full items-start gap-3 rounded-xl border p-3.5 transition-colors group-hover:border-ring/40 group-hover:bg-muted/40">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", t.className)}>
              <t.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{ins.title}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{ins.detail}</p>
            </div>
            {ins.href && <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />}
          </div>
        )
        return (
          <li key={ins.title}>
            {ins.href ? <Link href={ins.href} className="group block h-full">{body}</Link> : body}
          </li>
        )
      })}
    </ul>
  )
}
