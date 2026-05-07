"use client"

import { ArrowLeft, Plus } from "lucide-react"
import { AppBar } from "./app-bar"
import { ProgressCard } from "./progress-card"
import type { ReleaseBudget } from "./types"
import {
  Utensils,
  Car,
  Gamepad2,
  Heart,
} from "lucide-react"

interface MonthlyBudgetsViewProps {
  budgets: ReleaseBudget[]
  totalSpent: number
  totalBudget: number
  month: string
  onBack?: () => void
  onAddBudget?: () => void
}

const budgetIconMap: Record<string, React.ReactNode> = {
  alimentacao: <Utensils className="w-5 h-5" />,
  transporte: <Car className="w-5 h-5" />,
  lazer: <Gamepad2 className="w-5 h-5" />,
  saude: <Heart className="w-5 h-5" />,
}

const budgetColorMap: Record<string, string> = {
  blue: "bg-[var(--rls-primary-container)]",
  red: "bg-[var(--rls-error)]",
  green: "bg-[var(--rls-secondary-container)]",
  pink: "bg-[var(--rls-tertiary-container)]",
}

export function MonthlyBudgetsView({
  budgets,
  totalSpent,
  totalBudget,
  month,
  onBack,
  onAddBudget,
}: MonthlyBudgetsViewProps) {
  const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const remaining = totalBudget - totalSpent

  return (
    <div className="rls min-h-screen bg-[var(--rls-background)]">
      <AppBar title="Orçamentos Mensais" onBack={onBack} />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-lg)] pt-[var(--rls-stack-gap-md)] pb-32">
        {/* Total Budget Card */}
        <div className="bg-[var(--rls-surface-container-lowest)] rounded-[var(--rls-radius-lg)] p-[var(--rls-inline-padding-md)] shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                Orçamento Total
              </span>
              <p className="rls-text-label-md text-[var(--rls-on-surface-variant)]">
                {month}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="rls-text-display-md text-[var(--rls-on-surface)]">
              R$ {totalSpent.toLocaleString("pt-BR")}
            </span>
            <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
              / R$ {totalBudget.toLocaleString("pt-BR")} utilizados
            </span>
          </div>

          <div className="w-full h-2 bg-[var(--rls-surface-container-high)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--rls-primary-container)] rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between">
            <span className="rls-text-label-md text-[var(--rls-primary-container)]">
              {percentage}% utilizado
            </span>
            <span className="rls-text-label-md text-[var(--rls-on-surface-variant)]">
              R$ {remaining.toLocaleString("pt-BR")} restantes
            </span>
          </div>
        </div>

        {/* Budget Category Cards */}
        <div className="flex flex-col gap-[var(--rls-stack-gap-md)]">
          {budgets.map((budget) => (
            <ProgressCard
              key={budget.id}
              title={budget.category}
              subtitle={`R$ ${budget.spent.toLocaleString("pt-BR")} / R$ ${budget.total.toLocaleString("pt-BR")}`}
              current={budget.spent}
              target={budget.total}
              percentage={budget.percentage}
              color={budget.categoryColor as keyof typeof budgetColorMap || "blue"}
              remainingText={`R$ ${budget.remaining.toLocaleString("pt-BR")} restantes`}
              icon={budgetIconMap[budget.category] || budgetIconMap.alimentacao}
              iconBg={
                budget.categoryColor === "red"
                  ? "bg-[var(--rls-error-container)]"
                  : budget.categoryColor === "green"
                    ? "bg-[var(--rls-secondary-container)]/20"
                    : budget.categoryColor === "pink"
                      ? "bg-[var(--rls-tertiary-container)]/20"
                      : "bg-[var(--rls-primary-container)]/10"
              }
            />
          ))}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-[var(--rls-container-margin)] bg-gradient-to-t from-[var(--rls-background)] via-[var(--rls-background)] to-transparent pt-12">
        <button
          onClick={onAddBudget}
          className="w-full h-14 bg-[var(--rls-primary-container)] text-white rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors active:scale-[0.98] shadow-md shadow-[var(--rls-primary-container)]/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Novo Orçamento
        </button>
      </div>
    </div>
  )
}