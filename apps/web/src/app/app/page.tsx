import {
  getTransactionSummary,
  getBudgets,
  getGoals,
  getAccounts,
  getCreditCards,
} from "@/lib/api-server"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const [summary, budgets, goals, accounts, cards] = await Promise.all([
    getTransactionSummary(),
    getBudgets(),
    getGoals(),
    getAccounts(),
    getCreditCards(),
  ])

  return (
    <DashboardClient
      summary={summary}
      budgetsCount={budgets?.length ?? 0}
      goals={goals ?? []}
      accounts={accounts ?? []}
      creditCards={cards ?? []}
    />
  )
}
