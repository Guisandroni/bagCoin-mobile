"use client"

import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TransactionSummary } from "@/lib/api-server"
import { DashboardAreaChart } from "@/components/charts/area-chart"
import { cn } from "@/lib/utils"

interface Props {
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

export function BalanceCard({ summary, onConnectWhatsApp, connectBusy }: Props) {
  const balance = summary?.balance ?? 0
  const txCount = summary?.transaction_count ?? 0

  const balanceStr = Math.abs(balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  const mainPart = balanceStr.split(",")[0]
  const decimalPart = balanceStr.split(",")[1] || "00"

  const chartPoints = BALANCE_HISTORY.map((p) => ({ day: p.day, val: p.val }))

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7",
        "bg-[linear-gradient(145deg,color-mix(in_oklch,var(--card)_96%,var(--primary))_0%,var(--card)_55%)]"
      )}
    >
      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Saldo atual
        </p>
        <p className="mt-3 font-mono text-[2.5rem] font-semibold leading-none tracking-tight text-foreground sm:text-[3rem]">
          {balance < 0 ? "-" : ""}R$ {mainPart}
          <span className="text-[1.5rem] font-semibold text-muted-foreground sm:text-[1.75rem]">,{decimalPart}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className="border-0 bg-primary/15 text-primary hover:bg-primary/20">
            {txCount > 0 ? `${txCount} transações` : "Sem dados"}
          </Badge>
          {txCount === 0 && onConnectWhatsApp && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
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
          )}
        </div>
      </div>

      <div className="relative z-0 mt-4 h-[100px] w-full sm:h-[120px]">
        <DashboardAreaChart data={chartPoints} height={120} width={700} className="max-w-full" />
      </div>
    </div>
  )
}
