import dynamic from "next/dynamic"
import { getGoals } from "@/lib/api-server"
import { serverGoalToRelease } from "@/lib/adapters"
import MetasLoading from "./loading"

const MetasClient = dynamic(() => import("./metas-client").then((m) => m.MetasClient), {
  loading: () => <MetasLoading />,
})

export default async function MetasPage() {
  const serverGoals = await getGoals()
  const goals = (serverGoals ?? []).map(serverGoalToRelease)

  const totalCurrent = goals.reduce((s, g) => s + g.current, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const globalPercentage = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0

  return (
    <MetasClient
      goals={goals}
      totalCurrent={totalCurrent}
      totalTarget={totalTarget}
      globalPercentage={globalPercentage}
    />
  )
}