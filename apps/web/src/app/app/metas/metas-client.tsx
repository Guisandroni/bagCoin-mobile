"use client"

import { useRouter } from "next/navigation"
import { SavingsGoalsView } from "@/components/release/savings-goals-view"
import type { ReleaseGoal } from "@/components/release/types"

interface Props {
  goals: ReleaseGoal[]
  totalCurrent: number
  totalTarget: number
  globalPercentage: number
}

export function MetasClient({
  goals,
  totalCurrent,
  totalTarget,
  globalPercentage,
}: Props) {
  const router = useRouter()

  return (
    <div className="rls">
      <SavingsGoalsView
        goals={goals}
        totalCurrent={totalCurrent}
        totalTarget={totalTarget}
        globalPercentage={globalPercentage}
        onBack={() => router.back()}
        onAddGoal={() => router.push("/app/metas")}
      />
    </div>
  )
}