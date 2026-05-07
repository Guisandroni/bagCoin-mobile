"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface MiniSparklineProps {
  values: number[]
  positive?: boolean
  className?: string
  width?: number
  height?: number
}

export function MiniSparkline({
  values,
  positive = true,
  className,
  width = 60,
  height = 24,
}: MiniSparklineProps) {
  const { points } = useMemo(() => {
    if (!values.length) return { points: "" }
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1
    const n = values.length
    const pad = 2
    const w = width - pad * 2
    const h = height - pad * 2
    const pts = values
      .map((v, i) => {
        const x = n <= 1 ? pad + w / 2 : pad + (i / (n - 1)) * w
        const y = pad + h - ((v - min) / range) * h
        return `${x},${y}`
      })
      .join(" ")
    return { points: pts }
  }, [values, width, height])

  const stroke = positive ? "var(--success)" : "var(--danger)"

  if (!values.length) return <div className={cn("rounded bg-muted", className)} style={{ width, height }} />

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      aria-hidden
      role="img"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
