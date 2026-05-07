import { getTransactionSummary } from "@/lib/api-server"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const summary = await getTransactionSummary()

  return <DashboardClient summary={summary} />
}
