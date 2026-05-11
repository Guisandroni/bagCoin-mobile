"use client"

import { ArrowDown, ArrowUp, PlusCircle, Search, User } from "lucide-react"
import { AppBar } from "./app-bar"
import { InfoCard } from "./info-card"
import { DonutChart } from "./donut-chart"
import { BottomNavBar } from "./bottom-nav-bar"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "@/lib/category"
import type { ReleaseDashboardSummary, ReleaseNavItem } from "./types"

interface DashboardViewProps {
  summary: ReleaseDashboardSummary
  navItems: ReleaseNavItem[]
  onNavigate: (href: string) => void
  onViewAllTransactions?: () => void
  onAddGoal?: () => void
}

export function DashboardView({
  summary,
  navItems,
  onNavigate,
  onViewAllTransactions,
  onAddGoal,
}: DashboardViewProps) {
  return (
    <div className="rls min-h-screen bg-[var(--rls-background)] pb-24">
      <AppBar
        title="Centro Financeiro"
        avatar={
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--rls-surface-variant)] flex items-center justify-center">
            <User className="w-6 h-6 text-[var(--rls-outline)]" />
          </div>
        }

      />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-lg)] pt-[var(--rls-stack-gap-md)]">
        {/* Balance Section */}
        <section className="flex flex-col items-center">

          <span className="rls-text-body-md text-[var(--rls-on-surface-variant)] mb-1">
            Saldo Total
          </span>
          <h2 className="rls-text-display-lg text-[var(--rls-on-surface)]">
            R$ {summary.totalBalance.toLocaleString("pt-BR")}
          </h2>

          <div className="flex gap-[var(--rls-stack-gap-md)] mt-[var(--rls-stack-gap-md)] w-full">
            <InfoCard
              variant="primary"
              title="Receita"
              value={`R$ ${summary.income.toLocaleString("pt-BR")}`}
              icon={<ArrowDown className="w-4 h-4" />}
            />
            <InfoCard
              variant="default"
              value={`R$ ${summary.expenses.toLocaleString("pt-BR")}`}
              title="Despesas"
              icon={
                <ArrowUp className="w-4 h-4 text-[var(--rls-error)]" />
              }
            />
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="bg-[var(--rls-surface-container-lowest)] p-[var(--rls-inline-padding-md)] shadow-sm rounded-[var(--rls-radius)]">
          <div className="flex justify-between items-center mb-[var(--rls-stack-gap-md)]">
            <h3 className="rls-text-title-lg text-[var(--rls-on-surface)] text-base">
              Transações Recentes
            </h3>
            <button
              onClick={onViewAllTransactions}
              className="rls-text-label-lg text-[var(--rls-primary)]"
            >
              Ver tudo
            </button>
          </div>
          <div className="flex flex-col gap-[var(--rls-stack-gap-sm)]">
            {summary.recentTransactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center h-[72px] border-b border-[var(--rls-surface-variant)] last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      tx.type === "receita"
                        ? "bg-[var(--rls-secondary-container)]/20"
                        : "bg-[var(--rls-surface-container)]"
                    )}
                  >
                    <CategoryIcon
                      name={tx.category}
                      size={24}
                      className={tx.type === "receita" ? "text-[var(--rls-secondary)]" : "text-[var(--rls-on-surface-variant)]"}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="rls-text-body-lg text-[var(--rls-on-surface)] text-sm">
                      {tx.name}
                    </span>
                    <span className="rls-text-body-md text-[var(--rls-on-surface-variant)] text-xs">
                      {tx.date}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "rls-text-title-lg text-sm font-semibold",
                    tx.type === "receita"
                      ? "text-[var(--rls-secondary)]"
                      : "text-[var(--rls-on-surface)]"
                  )}
                >
                  {tx.type === "receita" ? "+" : "-"}R${" "}
                  {Math.abs(tx.amount).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Donut Chart */}
        <section className="grid grid-cols-1 gap-[var(--rls-stack-gap-md)]">
          <div className="bg-[var(--rls-surface-container-lowest)] rounded-xl p-[var(--rls-inline-padding-md)] shadow-sm">
            <DonutChart
              segments={summary.categoryBreakdown.map((cat) => ({
                value: cat.percentage,
                color: cat.color,
                label: cat.name,
              }))}
              centerValue={`R$ ${(summary.income - summary.expenses).toLocaleString("pt-BR")}`}
              centerLabel="Gasto Total"
            />
          </div>
        </section>

        {/* Goals & Budgets */}
        <section className="bg-[var(--rls-surface-container-lowest)] p-[var(--rls-inline-padding-md)] shadow-sm rounded-[var(--rls-radius)] flex flex-col gap-[var(--rls-stack-gap-md)] mb-4">
          <div className="flex justify-between items-center">
            <h3 className="rls-text-title-lg text-[var(--rls-on-surface)] text-base">
              Metas e Orçamentos
            </h3>
            {/* <button onClick={onAddGoal} className="text-[var(--rls-primary)]">
              <PlusCircle className="w-6 h-6" />
            </button> */}
          </div>

          <div className="flex flex-col gap-[var(--rls-stack-gap-md)]">
            {summary.goals.map((goal, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="rls-text-body-lg text-[var(--rls-on-surface)] text-sm">
                      {goal.name} 
                    </span>
                    <span className="rls-text-body-md text-[var(--rls-on-surface-variant)] text-xs">
                      R$ {goal.current.toLocaleString("pt-BR")} de R${" "}
                      {goal.target.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <span className="rls-text-label-lg text-[var(--rls-primary)] text-[10px]">
                    {goal.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--rls-surface-container-high)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--rls-primary-container)] rounded-full"
                    style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNavBar items={navItems} onNavigate={onNavigate} />
    </div>
  )
}