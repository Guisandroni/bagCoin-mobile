import { getBudgets } from "@/lib/api-server"
import OrcamentosClient from "./orcamentos-client"

export default async function OrcamentosPage() {
  const budgets = await getBudgets()

  return <OrcamentosClient serverBudgets={budgets ?? []} />
}
