"use client"

import { useId, useMemo } from "react"

export interface AreaChartPoint {
  day: string
  val: number
}

interface DashboardAreaChartProps {
  data: readonly AreaChartPoint[] | AreaChartPoint[]
  width?: number
  height?: number
  color?: string
  className?: string
  /** Coinbase-style: no horizontal grid lines */
  flat?: boolean
  /** Hide day labels under chart */
  hideLabels?: boolean
}

export function DashboardAreaChart({
  data,
  width = 600,
  height = 140,
  color = "var(--primary)",
  className,
  flat = false,
  hideLabels = false,
}: DashboardAreaChartProps) {
  const gid = useId().replace(/:/g, "")
  const gradId = `areaGrad-${gid}`

  const { pad, w, h, maxV, minV, range, points, areaPoints } = useMemo(() => {
    const pad = { top: 10, right: 10, bottom: 20, left: 10 }
    const w = width - pad.left - pad.right
    const h = height - pad.top - pad.bottom
    if (!data.length) {
      return { pad, w, h, maxV: 1, minV: 0, range: 1, points: "", areaPoints: "" }
    }
    const maxV = Math.max(...data.map((d) => d.val))
    const minV = Math.min(...data.map((d) => d.val))
    const range = maxV - minV || 1
    const n = data.length
    const points = data
      .map((d, i) => {
        const x = n <= 1 ? pad.left + w / 2 : (i / (n - 1)) * w + pad.left
        const y = pad.top + h - ((d.val - minV) / range) * h
        return `${x},${y}`
      })
      .join(" ")
    const areaPoints = `${pad.left},${pad.top + h} ${points} ${pad.left + w},${pad.top + h}`
    return { pad, w, h, maxV, minV, range, points, areaPoints }
  }, [data, height, width])

  if (!data.length) return null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Histórico de saldo"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {!flat &&
        [0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={pad.left}
            y1={pad.top + h * frac}
            x2={pad.left + w}
            y2={pad.top + h * frac}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const n = data.length
        const cx = n <= 1 ? pad.left + w / 2 : (i / (n - 1)) * w + pad.left
        const cy = pad.top + h - ((d.val - minV) / range) * h
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3" fill={color} opacity="0">
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="0.3s"
                begin={`${i * 0.1}s`}
                fill="freeze"
              />
            </circle>
          </g>
        )
      })}
      {!hideLabels &&
        data.map((d, i) => {
          const n = data.length
          const x = n <= 1 ? pad.left + w / 2 : (i / (n - 1)) * w + pad.left
          return (
            <text
              key={`lbl-${i}`}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted-foreground)"
              fontFamily="var(--font-sans)"
            >
              {d.day}
            </text>
          )
        })}
    </svg>
  )
}
