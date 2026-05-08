"use client"

import { usePathname } from "next/navigation"
import { DashboardView } from "@/components/release/dashboard-view"
import { getReleaseNavItems, summaryToDashboardSummary } from "@/lib/adapters"
import type { TransactionSummary, ServerBudget, ServerGoal } from "@/lib/api-server"

interface Props {
  summary: TransactionSummary | null
  budgets: ServerBudget[] | null
  goals: ServerGoal[] | null
}

export function DashboardClient({ summary, budgets, goals }: Props) {
  const pathname = usePathname()
  const dashboardData = summaryToDashboardSummary(summary, budgets, goals)
  const navItems = getReleaseNavItems(pathname)

  return (
    <DashboardView
      summary={dashboardData}
      navItems={navItems}
      onNavigate={(href) => {
        if (href === "#settings") return
        window.location.href = href
      }}
      onViewAllTransactions={() => {
        window.location.href = "/app/transacoes"
      }}
      onAddGoal={() => {
        window.location.href = "/app/metas"
      }}
    />
  )
}