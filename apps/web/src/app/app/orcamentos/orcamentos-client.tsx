"use client"

import { MonthlyBudgetsView } from "@/components/release/monthly-budgets-view"
import type { ReleaseBudget } from "@/components/release/types"

interface Props {
  budgets: ReleaseBudget[]
  totalSpent: number
  totalBudget: number
}

export function OrcamentosClient({ budgets, totalSpent, totalBudget }: Props) {
  const now = new Date()
  const month = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <div className="rls">
      <MonthlyBudgetsView
        budgets={budgets}
        totalSpent={totalSpent}
        totalBudget={totalBudget}
        month={month}
        onBack={() => window.history.back()}
        onAddBudget={() => {
          window.location.href = "/app/orcamentos"
        }}
      />
    </div>
  )
}