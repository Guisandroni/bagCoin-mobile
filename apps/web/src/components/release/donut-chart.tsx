"use client"

import { cn } from "@/lib/utils"

interface DonutChartProps {
  segments: { value: number; color: string; label: string }[]
  centerLabel?: string
  centerValue?: string
  listTitle?: string
  className?: string
}

export function DonutChart({
  segments,
  centerLabel = "Gasto Total",
  centerValue = "R$ 0",
  listTitle = "Gastos por Categoria",
  className,
}: DonutChartProps) {
  const radius = 16
  const slices = segments.map((segment, index) => ({
    ...segment,
    offset: segments.slice(0, index).reduce((sum, item) => sum + item.value, 0),
  }))
  const dotColorClass = (color: string) => {
    if (color.startsWith("text-")) return color.replace(/^text-/, "bg-")
    return color
  }

  return (
    <div className={cn("flex flex-col gap-[var(--rls-stack-gap-md)]", className)}>
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <circle
              className="text-[var(--rls-surface-container-high)]"
              cx="18"
              cy="18"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
            />
            {slices.map((segment, i) => {
              return (
                <circle
                  key={i}
                  className={cn(segment.color)}
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r={radius}
                  stroke="currentColor"
                  strokeDasharray={`${segment.value}, ${100 - segment.value}`}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="round"
                  strokeWidth="4"
                  transform="rotate(-90 18 18)"
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[12px] font-bold text-[var(--rls-on-surface)]">
              {centerValue}
            </span>
            <span className="text-[9px] text-[var(--rls-on-surface-variant)]">
              {centerLabel}
            </span>
          </div>
        </div>
      </div>

      <h3 className="rls-text-title-lg text-[var(--rls-on-surface)] text-base">
        {listTitle}
      </h3>

      <div className="flex flex-col gap-3">
        {segments.map((segment, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn("w-3 h-3 rounded-full", dotColorClass(segment.color))}
              />
              <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                {segment.label}
              </span>
            </div>
            <span className="rls-text-body-lg text-[var(--rls-on-surface)] font-bold">
              {segment.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
