import { cn } from "@/lib/utils"
import type { Tone } from "@/components/status-pill"

const iconTone: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  footer,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  tone?: Tone
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("surface flex min-w-0 flex-col gap-3 p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow pt-1">{label}</p>
        {Icon && (
          <span className={cn("hidden size-9 shrink-0 items-center justify-center rounded-xl sm:flex", iconTone[tone])}>
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <div className="text-xl leading-7 font-bold tracking-tight sm:text-2xl sm:leading-8">{value}</div>
      {hint && <div className="text-[13px] text-muted-foreground">{hint}</div>}
      {footer}
    </div>
  )
}
