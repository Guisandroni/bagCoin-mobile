"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { CATEGORIES } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { TransactionSummary } from "@/lib/api-server"

// Lazy-load heavy chart components
const BalanceCard = dynamic(
  () => import("@/components/dashboard/balance-card").then((m) => ({ default: m.BalanceCard })),
  { ssr: false, loading: () => <Skeleton className="h-[200px] rounded-2xl" /> }
)

const CategoryBreakdown = dynamic(
  () => import("@/components/dashboard/category-breakdown").then((m) => ({ default: m.CategoryBreakdown })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] rounded-xl" /> }
)

interface Props {
  summary: TransactionSummary | null
}

export function DashboardClient({ summary }: Props) {
  const { openModal } = useAppStore()

  const totalIncome = summary?.total_income ?? 0
  const totalExpenses = summary?.total_expenses ?? 0
  const balance = summary?.balance ?? 0
  const savings = totalIncome - totalExpenses
  const savingsPercent = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  const pendingCount = summary?.recent_transactions?.filter((t) => t.status === "pending").length ?? 0
  const categoryData = summary?.categories ?? []
  const transactions = summary?.recent_transactions ?? []

  const stats = [
    { label: "RECEITAS EM ABR", value: formatCurrency(totalIncome), sub: "Salário + freelance", icon: TrendingUp, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { label: "DESPESAS EM ABR", value: formatCurrency(totalExpenses), sub: `${categoryData.length} categorias`, icon: TrendingDown, color: "text-red-500", bgColor: "bg-red-500/10" },
    { label: "ECONOMIA ESTIMADA", value: formatCurrency(savings), sub: `${savingsPercent}% da receita`, icon: PiggyBank, color: "text-brand", bgColor: "bg-accent" },
  ]

  return (
    <div className="space-y-6 pb-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Visão geral</h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm">Exportar</button>
          <button
            className="rounded-lg bg-[#0a0b0d] px-3 py-1.5 text-sm text-white"
            onClick={() => openModal("new-transaction")}
          >
            Novo lançamento
          </button>
        </div>
      </div>

      <BalanceCard summary={summary} />

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", stat.bgColor)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gastos por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown categories={summary?.categories ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Transações recentes</CardTitle>
          <Link href="/app/transacoes" className="text-sm text-muted-foreground hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Nenhuma transação recente</p>
          ) : (
            transactions.map((t, i) => (
              <button
                key={t.id || i}
                className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
                onClick={() => openModal("transaction-detail")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", t.amount > 0 ? "bg-emerald-500/10" : "bg-red-500/10")}>
                    {t.amount > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name || t.description}</p>
                    <p className="text-[11px] text-muted-foreground">{t.category || t.category_name} · {t.date || t.transaction_date}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", t.amount > 0 ? "text-emerald-500" : "text-red-500")}>
                  {formatCurrency(t.amount)}
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {pendingCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm">
              <span className="font-medium">{pendingCount} transações</span> pendentes de confirmação.
              <Link href="/app/confirmacoes" className="ml-1 font-medium underline">Revisar agora</Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
