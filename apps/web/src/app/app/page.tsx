"use client"

import { useTransactionSummary } from "@/hooks/use-transactions"
import { MOCK_BUDGETS, BALANCE_HISTORY } from "@/data/mock"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart } from "recharts"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeInUp } from "@/components/ui/animation"

function formatCurrency(v: number) {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  return (v < 0 ? "-R$ " : "R$ ") + formatted
}

const chartData = BALANCE_HISTORY.map((v, i) => ({ month: i, value: v }))

const donutData = [
  { name: "Alimentação", value: 38, color: "#ff6b35" },
  { name: "Moradia", value: 22, color: "#7c3aed" },
  { name: "Transporte", value: 15, color: "#0052ff" },
  { name: "Lazer", value: 12, color: "#ffab00" },
  { name: "Saúde", value: 8, color: "#00c853" },
  { name: "Compras", value: 5, color: "#e91e63" },
]

export default function DashboardPage() {
  const { data: summary, isLoading } = useTransactionSummary()
  const transactions = useAppStore((s) => s.transactions)

  const balance = summary?.balance ?? 8347.6
  const totalIncome = summary?.total_income ?? 8500
  const totalExpenses = summary?.total_expenses ?? 5280
  const savings = balance
  const savingsPercent = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0
  const pendingCount = transactions.filter((t) => t.status === "pending").length
  const recentTransactions = summary?.recent_transactions ?? transactions.slice(0, 5)
  const categories = summary?.categories ?? []

  return (
    <div className="p-4 lg:p-7">
      <FadeInUp delay={0}>
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="lg:col-span-2">
            <BalanceCard balance={balance} isLoading={isLoading} />
          </div>
          <div className="space-y-4 lg:space-y-5">
            <StatCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              savings={savings}
              savingsPercent={savingsPercent}
              isLoading={isLoading}
            />
          </div>
        </div>
      </FadeInUp>

      {pendingCount > 0 && (
        <FadeInUp delay={1}>
          <PendingAlert count={pendingCount} className="mt-4 lg:mt-5" />
        </FadeInUp>
      )}

      <FadeInUp delay={2}>
        <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-2 lg:gap-5">
          <CategoryBreakdown categories={categories} isLoading={isLoading} />
          <RecentTransactions transactions={recentTransactions} isLoading={isLoading} />
        </div>
      </FadeInUp>
    </div>
  )
}

function BalanceCard({ balance, isLoading }: { balance: number; isLoading: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0b0d] p-6 text-white lg:p-7">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-12 w-64 bg-white/10" />
          <Skeleton className="h-6 w-32 bg-white/10" />
        </div>
      ) : (
        <>
          <div className="relative z-10">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
              Saldo atual
            </p>
            <p className="mt-4 font-heading text-[40px] font-semibold leading-none tracking-tight lg:text-[48px]">
              {formatCurrency(balance).replace("-R$", "R$").split(",")[0]}
              <span className="text-[28px] opacity-50">,{formatCurrency(balance).split(",")[1]}</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge className="border-0 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                +3,8% este mês
              </Badge>
              <span className="text-[12px] text-white/40">vs. Mar 2026</span>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-0 h-[80px]">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#578bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#578bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#578bfa" strokeWidth={2} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function StatCards({ totalIncome, totalExpenses, savings, savingsPercent, isLoading }: {
  totalIncome: number; totalExpenses: number; savings: number; savingsPercent: number; isLoading: boolean
}) {
  const stats = [
    { label: "Receitas em Abr", value: formatCurrency(totalIncome), sub: "Salário + freelance", icon: TrendingUp, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { label: "Despesas em Abr", value: formatCurrency(totalExpenses), sub: "6 categorias", icon: TrendingDown, color: "text-red-500", bgColor: "bg-red-500/10" },
    { label: "Economia estimada", value: formatCurrency(savings), sub: `${savingsPercent}% da receita`, icon: PiggyBank, color: "text-brand", bgColor: "bg-accent" },
  ]

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {isLoading ? (
        <>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl border-border/60 shadow-none">
              <CardContent className="p-4 lg:p-5">
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        stats.map((stat) => (
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
        ))
      )}
    </div>
  )
}

function PendingAlert({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20">
        <AlertTriangle className="h-5 w-5 text-warning" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">Pendências do WhatsApp</p>
        <p className="text-[12px] text-muted-foreground">Aguardando sua revisão</p>
      </div>
      <Badge className="border-0 bg-warning/20 text-warning hover:bg-warning/30">
        {count} confirmações
      </Badge>
    </div>
  )
}

function CategoryBreakdown({ categories, isLoading }: { categories: Array<{ name: string; amount: number; color: string }>; isLoading: boolean }) {
  const displayData = categories.length > 0 ? categories : donutData.map((d) => ({
    name: d.name,
    amount: MOCK_BUDGETS.find((b) => b.category === d.name)?.spent ?? 0,
    color: d.color,
  }))

  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-semibold">Gastos por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-5">
            <Skeleton className="h-[140px] w-[140px] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {displayData.slice(0, 6).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">
                    R$ {cat.amount.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentTransactions({ transactions, isLoading }: { transactions: Array<{ id: string; name: string; category: string; amount: number; date: string; source: string; status: string }>; isLoading: boolean }) {
  const { openModal } = useAppStore()

  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[14px] font-semibold">Últimas transações</CardTitle>
        <Link
          href="/app/transacoes"
          className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          Ver todas
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </>
        ) : (
          transactions.slice(0, 5).map((t) => {
            const cat = CATEGORIES.find((c) => c.name === t.category)
            return (
              <button
                key={t.id}
                onClick={() => {
                  const fullTx = useAppStore.getState().transactions.find((tx) => tx.id === t.id)
                  openModal("transaction-detail", fullTx || { ...t, source: (t.source as "manual" | "whatsapp" | "auto"), status: (t.status as "confirmed" | "pending") })
                }}
                className="flex w-full items-center gap-3 border-b border-border/60 px-5 py-3 text-left transition-colors hover:bg-muted/50 last:border-0"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]"
                  style={{ backgroundColor: `${cat?.color}14` }}
                >
                  {cat?.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{t.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t.category} · {t.date}
                    {t.source === "whatsapp" && " · via WhatsApp"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn(
                    "font-heading text-[14px] font-semibold tracking-tight",
                    t.amount < 0 ? "text-danger" : "text-success"
                  )}>
                    {formatCurrency(t.amount)}
                  </p>
                  {t.status === "pending" && (
                    <Badge className="mt-1 border-0 bg-warning/15 text-warning hover:bg-warning/25 [&]:text-[9px] [&]:px-1.5 [&]:py-0">
                      pendente
                    </Badge>
                  )}
                </div>
              </button>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}