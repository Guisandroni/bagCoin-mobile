"use client"

import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTransactionSummary } from "@/hooks/use-transactions"

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}

export function StatCards() {
  const { data, isLoading } = useTransactionSummary()

  const income = data?.total_income ?? 0
  const expenses = data?.total_expenses ?? 0
  const savings = income - expenses
  const savingsPct = income > 0 ? Math.round((savings / income) * 100) : 0

  const stats = [
    {
      label: "Receitas",
      value: isLoading ? "..." : formatCurrency(income),
      sub: `${data?.transaction_count ?? 0} transações`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Despesas",
      value: isLoading ? "..." : formatCurrency(expenses),
      sub: `${data?.categories?.length ?? 0} categorias`,
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Economia",
      value: isLoading ? "..." : formatCurrency(savings),
      sub: `${savingsPct}% da receita`,
      icon: PiggyBank,
      color: "text-brand",
      bgColor: "bg-accent",
    },
  ]

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-2xl border-border/60 shadow-none">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className={`font-heading text-2xl font-semibold tracking-tight ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[12px] text-muted-foreground">{stat.sub}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
