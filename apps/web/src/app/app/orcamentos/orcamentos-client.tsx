"use client"

import { useRouter } from "next/navigation"
import { MonthlyBudgetsView } from "@/components/release/monthly-budgets-view"
import type { ReleaseBudget } from "@/components/release/types"

interface Props {
  budgets: ReleaseBudget[]
  totalSpent: number
  totalBudget: number
}

export function OrcamentosClient({ budgets, totalSpent, totalBudget }: Props) {
  const router = useRouter()
  const now = new Date()
  const month = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <div className="rls">
      <MonthlyBudgetsView
        budgets={budgets}
        totalSpent={totalSpent}
        totalBudget={totalBudget}
        month={month}
        onBack={() => router.back()}
        onAddBudget={() => router.push("/app/orcamentos")}
      />
    </div>
  )
}