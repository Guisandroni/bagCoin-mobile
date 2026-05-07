import { getGoals } from "@/lib/api-server"
import { MetasClient, type MetasGoal } from "./metas-client"

export default async function MetasPage() {
  const serverGoals = await getGoals()

  // getGoals returns ServerGoal[] (which has "name" in the type),
  // but the API actually returns "title". Cast to MetasGoal shape
  // which matches the runtime data.
  const goals: MetasGoal[] = (serverGoals ?? []) as unknown as MetasGoal[]

  return <MetasClient initialGoals={goals} />
}
