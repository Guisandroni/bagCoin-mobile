import dynamic from "next/dynamic"
import { getBudgets } from "@/lib/api-server"
import { serverBudgetToRelease } from "@/lib/adapters"
import OrcamentosLoading from "./loading"

const OrcamentosClient = dynamic(() => import("./orcamentos-client").then((m) => m.OrcamentosClient), {
  loading: () => <OrcamentosLoading />,
})

export default async function OrcamentosPage() {
  const budgets = await getBudgets()
  const releaseBudgets = (budgets ?? []).map(serverBudgetToRelease)

  const totalSpent = releaseBudgets.reduce((sum, b) => sum + b.spent, 0)
  const totalBudget = releaseBudgets.reduce((sum, b) => sum + b.total, 0)

  return (
    <OrcamentosClient
      budgets={releaseBudgets}
      totalSpent={totalSpent}
      totalBudget={totalBudget}
    />
  )
}