// Cincin okupansi (stat tile, bukan chart interaktif)
export function OccupancyRing({ filled, total, size = 132 }: { filled: number; total: number; size?: number }) {
  const pct = total > 0 ? filled / total : 0
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`Okupansi ${Math.round(pct * 100)} persen`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] leading-none font-bold tracking-tight">{Math.round(pct * 100)}%</span>
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">terisi</span>
      </div>
    </div>
  )
}
