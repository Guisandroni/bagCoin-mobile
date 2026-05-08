"use client"

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
  return (
    <div className="rls">
      <SavingsGoalsView
        goals={goals}
        totalCurrent={totalCurrent}
        totalTarget={totalTarget}
        globalPercentage={globalPercentage}
        onBack={() => window.history.back()}
        onAddGoal={() => {
          window.location.href = "/app/metas"
        }}
      />
    </div>
  )
}