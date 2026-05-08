"use client"

import { cn } from "@/lib/utils"

export type TimeRangeKey = "1d" | "7d" | "30d" | "90d" | "1y" | "all"

const OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1A" },
  { key: "all", label: "Tudo" },
]

interface TimeRangeSelectorProps {
  value: TimeRangeKey
  onChange: (v: TimeRangeKey) => void
  className?: string
}

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Intervalo do gráfico"
      className={cn(
        "scrollbar-hide flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "touch-target shrink-0 rounded-full px-3 text-[13px] font-semibold transition-colors",
              active
                ? "bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] text-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
