import { cn } from "@/lib/utils"

export type Tone = "success" | "warning" | "danger" | "info" | "neutral"

const toneClass: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
}

const dotClass: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground/60",
}

export function StatusPill({
  tone = "neutral",
  icon: Icon,
  dot,
  children,
  className,
}: {
  tone?: Tone
  icon?: React.ComponentType<{ className?: string }>
  dot?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        toneClass[tone],
        className
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {dot && !Icon && <span className={cn("size-1.5 rounded-full", dotClass[tone])} />}
      {children}
    </span>
  )
}
