"use client"

import { CreateGoalBudget } from "@/components/release"

export default function CriarMetaPreview() {
  return (
    <CreateGoalBudget
      onBack={() => console.log("Back")}
      onSubmit={(data) => console.log("Submit:", data)}
    />
  )
}