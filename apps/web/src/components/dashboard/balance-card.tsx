"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import type { TransactionSummary } from "@/lib/api-server"

interface Props {
  summary?: TransactionSummary | null
}

export function BalanceCard({ summary }: Props) {
  const balance = summary?.balance ?? 0
  const txCount = summary?.transaction_count ?? 0

  const balanceStr = Math.abs(balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  const mainPart = balanceStr.split(",")[0]
  const decimalPart = balanceStr.split(",")[1] || "00"

  const chartData = summary?.recent_transactions
    ?.map((_, i, arr) => {
      const incomeSum = arr
        .slice(0, i + 1)
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      return { month: i, value: incomeSum }
    }) ?? [{ month: 0, value: 0 }]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0b0d] p-6 text-white lg:p-7">
      <div className="relative z-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
          Saldo atual
        </p>
        <p className="mt-4 font-heading text-[40px] font-semibold leading-none tracking-tight lg:text-[48px]">
          {balance < 0 ? "-" : ""}R$ {mainPart}
          <span className="text-[28px] opacity-50">,{decimalPart}</span>
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge className="border-0 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
            {txCount > 0 ? `${txCount} transações` : "Carregando..."}
          </Badge>
        </div>
      </div>
      {summary && (
        <div className="absolute inset-x-0 bottom-0 z-0 h-[80px]">
          <ResponsiveContainer width="100%" height={80} minWidth={0}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#578bfa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#578bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#578bfa"
                strokeWidth={2}
                fill="url(#balanceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
