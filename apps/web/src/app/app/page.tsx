import dynamic from "next/dynamic"
import {
  getTransactionSummary,
  getBudgets,
  getGoals,
} from "@/lib/api-server"
import DashboardLoading from "./loading"

const DashboardClient = dynamic(() => import("./dashboard-client").then((m) => m.DashboardClient), {
  loading: () => <DashboardLoading />,
})

export default async function DashboardPage() {
  const [summary, budgets, goals] = await Promise.all([
    getTransactionSummary(),
    getBudgets(),
    getGoals(),
  ])

  return (
    <DashboardClient
      summary={summary}
      budgets={budgets}
      goals={goals}
    />
  )
}