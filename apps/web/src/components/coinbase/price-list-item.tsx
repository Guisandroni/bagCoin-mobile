"use client"

import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { MiniSparkline } from "./mini-sparkline"
import { cn } from "@/lib/utils"

interface PriceListItemProps {
  icon?: ReactNode
  name: string
  ticker?: string
  priceLabel: string
  deltaPercent: number
  sparklineValues?: number[]
  onClick?: () => void
  className?: string
}

export function PriceListItem({
  icon,
  name,
  ticker,
  priceLabel,
  deltaPercent,
  sparklineValues = [],
  onClick,
  className,
}: PriceListItemProps) {
  const positive = deltaPercent >= 0
  const pctStr = `${positive ? "+" : ""}${deltaPercent.toFixed(1)}%`

  const row = (
    <div
      className={cn(
        "flex min-h-[56px] w-full items-center gap-2 rounded-xl px-2 py-2 transition-colors",
        onClick && "cursor-pointer active:bg-muted/60",
        className
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold">{name}</p>
        {ticker ? <p className="text-[12px] text-muted-foreground">{ticker}</p> : null}
      </div>
      <MiniSparkline values={sparklineValues.length ? sparklineValues : [1, 2, 1.5, 2.2]} positive={positive} />
      <div className="shrink-0 text-right">
        <p className="row-amount text-foreground">{priceLabel}</p>
        <p
          className={cn(
            "mt-0.5 inline-flex items-center justify-end gap-0.5 text-[12px] font-semibold",
            positive ? "text-success" : "text-danger"
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
          )}
          <span>{pctStr}</span>
        </p>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {row}
      </button>
    )
  }

  return row
}
