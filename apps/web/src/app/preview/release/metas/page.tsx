"use client"

import { SavingsGoalsView } from "@/components/release"
import { mockGoals, mockNavItems } from "@/components/release/__preview__/mock-data"

export default function MetasPreview() {
  return (
    <SavingsGoalsView
      goals={mockGoals}
      totalCurrent={15400}
      totalTarget={25000}
      globalPercentage={62}
      onBack={() => console.log("Back")}
      onAddGoal={() => console.log("Add goal")}
    />
  )
}