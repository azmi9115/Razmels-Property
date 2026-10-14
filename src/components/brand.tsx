import { cn } from "@/lib/utils"

// Ikon "RP" dari logo di atas kotak navy brand
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-navy ring-1 ring-white/10",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand-mark.png" alt="" className="size-[72%] object-contain" />
    </span>
  )
}

export function BrandWordmark({ className, subtitle = "Property Management" }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span className="truncate text-[15px] font-bold tracking-tight">Razmel&apos;s Property</span>
      {subtitle && <span className="mt-1 truncate text-[11px] font-medium opacity-60">{subtitle}</span>}
    </span>
  )
}
