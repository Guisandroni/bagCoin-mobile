"use client"

import { useMemo, useState } from "react"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TransactionSummary } from "@/lib/api-server"
import { DashboardAreaChart, type AreaChartPoint } from "@/components/charts/area-chart"
import { TimeRangeSelector, type TimeRangeKey } from "./time-range-selector"

interface HeroBalanceCardProps {
  summary?: TransactionSummary | null
  onConnectWhatsApp?: () => void
  connectBusy?: boolean
}

const BALANCE_HISTORY = [
  { day: "28/04", val: 14800 },
  { day: "29/04", val: 16100 },
  { day: "30/04", val: 15300 },
  { day: "01/05", val: 18200 },
  { day: "02/05", val: 19900 },
  { day: "03/05", val: 21500 },
  { day: "04/05", val: 23568 },
] as const

export function chartPointsForRange(range: TimeRangeKey): AreaChartPoint[] {
  const base = BALANCE_HISTORY.map((p) => ({ day: p.day, val: p.val }))
  switch (range) {
    case "1d":
      return base.slice(-2)
    case "7d":
      return base
    case "30d":
      return base
    case "90d":
      return base
    case "1y":
      return base
    default:
      return base
  }
}

export function HeroBalanceCard({ summary, onConnectWhatsApp, connectBusy }: HeroBalanceCardProps) {
  const balance = summary?.balance ?? 0
  const txCount = summary?.transaction_count ?? 0
  const [range, setRange] = useState<TimeRangeKey>("7d")
  const [expanded, setExpanded] = useState(true)

  const chartPoints = useMemo(() => chartPointsForRange(range), [range])

  const balanceStr = Math.abs(balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  const mainPart = balanceStr.split(",")[0]
  const decimalPart = balanceStr.split(",")[1] || "00"

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Saldo atual</p>
            <p className="amount-display mt-2 text-foreground">
              {balance < 0 ? "−" : ""}R$ {mainPart}
              <span className="text-[1.35rem] font-semibold text-muted-foreground sm:text-[1.5rem]">,{decimalPart}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full border-0 bg-muted px-2.5 py-0.5 text-[11px] font-semibold">
                {txCount > 0 ? `${txCount} lançamentos` : "Sem dados"}
              </Badge>
              {txCount === 0 && onConnectWhatsApp ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full text-xs"
                  type="button"
                  disabled={connectBusy}
                  onClick={onConnectWhatsApp}
                >
                  {connectBusy ? (
                    <>
                      <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                      Abrindo…
                    </>
                  ) : (
                    "Conectar WhatsApp"
                  )}
                </Button>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="touch-target shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-expanded={expanded}
            aria-label={expanded ? "Recolher gráfico" : "Expandir gráfico"}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="px-3 pb-2">
            <TimeRangeSelector value={range} onChange={setRange} />
          </div>
          <div className="h-[120px] w-full px-2 pb-3">
            <DashboardAreaChart
              data={chartPoints}
              height={120}
              width={640}
              flat
              hideLabels={range === "1d"}
              className="max-w-full"
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
