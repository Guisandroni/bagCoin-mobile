"use client"

import { DashboardView } from "@/components/release"
import { mockDashboardSummary, mockNavItems } from "@/components/release/__preview__/mock-data"

export default function DashboardPreview() {
  return (
    <DashboardView
      summary={mockDashboardSummary}
      navItems={mockNavItems}
      onNavigate={(href) => console.log("Navigate:", href)}
      onViewAllTransactions={() => console.log("View all transactions")}
      onAddGoal={() => console.log("Add goal")}
    />
  )
}