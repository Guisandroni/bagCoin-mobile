import type {
  ReleaseTransaction,
  ReleaseGoal,
  ReleaseBudget,
  ReleaseDashboardSummary,
  ReleaseCategory,
  ReleaseReport,
  ReleaseNavItem,
  ReleaseProfile,
} from "@/components/release/types"
import type {
  ServerTransaction,
  ServerGoal,
  ServerBudget,
  TransactionSummary,
  ServerReport,
} from "@/lib/api-server"
import { useAuthStore } from "@/lib/auth-store"
import { getCategoryEmoji, getCategoryColor } from "@/lib/category"

export function serverTransactionToRelease(
  tx: ServerTransaction
): ReleaseTransaction {
  const typeName = tx.type === "INCOME" || (!tx.type && tx.amount >= 0) ? "receita" : "despesa"
  const catName = tx.category || tx.category_name || ""
  return {
    id: tx.id,
    name: tx.name || tx.description || "",
    category: catName,
    categoryIcon: getCategoryEmoji(catName),
    amount: tx.amount,
    date: tx.date || tx.transaction_date || "",
    type: typeName,
    source: tx.source,
  }
}

export function serverGoalToRelease(goal: ServerGoal): ReleaseGoal {
  const catType = mapGoalCategory(goal.title)
  return {
    id: String(goal.id),
    name: goal.title || "Meta",
    target: goal.target_amount,
    current: goal.current_amount,
    deadline: goal.deadline ?? undefined,
    category: catType,
    color: getCategoryColor(goal.title),
  }
}

export function serverBudgetToRelease(budget: ServerBudget): ReleaseBudget {
  const catName = budget.category_name || budget.name || ""
  return {
    id: String(budget.id),
    category: catName,
    categoryIcon: getCategoryEmoji(catName),
    categoryColor: mapBudgetColor(budget.percentage),
    spent: budget.total_spent,
    total: budget.total_limit,
    remaining: budget.total_remaining,
    percentage: budget.percentage,
  }
}

export function serverReportToRelease(report: ServerReport): ReleaseReport {
  const statusMap: Record<string, ReleaseReport["status"]> = {
    completed: "concluido",
    archived: "arquivado",
    pending: "pendente",
  }
  const typeMap: Record<string, ReleaseReport["type"]> = {
    monthly: "mensal",
    yearly: "anual",
    tax: "imposto",
    custom: "custom",
  }
  return {
    id: String(report.id),
    name: `Relatório ${report.period_start?.slice(0, 7) ?? ""}`,
    period: report.period_start ?? "",
    date: new Date(report.created_at).toLocaleDateString("pt-BR"),
    status: statusMap[report.file_url ? "completed" : "pending"] ?? "pendente",
    type: "mensal",
  }
}

export function summaryToDashboardSummary(
  summary: TransactionSummary | null,
  budgets: ServerBudget[] | null,
  goals: ServerGoal[] | null
): ReleaseDashboardSummary {
  const recent = (summary?.recent_transactions ?? []).slice(0, 4).map(serverTransactionToRelease)
  const categories = (summary?.categories ?? []).map((cat) => ({
    name: cat.name,
    percentage: summary?.total_expenses
      ? Math.round((cat.amount / summary.total_expenses) * 100)
      : 0,
    color: cat.color,
  }))

  const goalProgress = (goals ?? []).map((g) => ({
    name: g.title,
    current: g.current_amount,
    target: g.target_amount,
    percentage: g.percentage,
  }))

  return {
    totalBalance: summary?.balance ?? 0,
    income: summary?.total_income ?? 0,
    expenses: summary?.total_expenses ?? 0,
    recentTransactions: recent,
    categoryBreakdown: categories,
    goals: goalProgress,
  }
}

export function categoriesFromSummary(
  summary: TransactionSummary | null
): ReleaseCategory[] {
  if (!summary) return []
  return (summary.categories ?? []).map((cat, i) => ({
    name: cat.name,
    icon: getCategoryEmoji(cat.name),
    color: cat.color,
    allocated: cat.amount,
    percentage: summary.total_expenses
      ? Math.round((cat.amount / summary.total_expenses) * 100)
      : 0,
    type: "despesa" as const,
  }))
}

export function getReleaseProfile(): ReleaseProfile {
  const { user } = useAuthStore.getState()
  return {
    name: user?.full_name ?? "Usuário",
    email: user?.email ?? "",
    avatarUrl: user?.avatar_url ?? undefined,
    phone: user?.phone_number ?? undefined,
    tier: "Investidor Pro",
  }
}

export function getReleaseNavItems(
  pathname: string
): ReleaseNavItem[] {
  return [
    {
      label: "Início",
      icon: "home",
      href: "/app",
      isActive: pathname === "/app",
    },
    {
      label: "Transações",
      icon: "portfolio",
      href: "/app/transacoes",
      isActive: pathname.startsWith("/app/transacoes"),
    },
    {
      label: "Orçamentos",
      icon: "wallet",
      href: "/app/orcamentos",
      isActive: pathname.startsWith("/app/orcamentos"),
    },
    {
      label: "Metas",
      icon: "home",
      href: "/app/metas",
      isActive: pathname.startsWith("/app/metas"),
    },
    {
      label: "Categorias",
      icon: "categorias",
      href: "/app/categorias",
      isActive: pathname.startsWith("/app/categorias"),
    },
  ]
}

function mapGoalCategory(name: string): ReleaseCategoryType {
  const lower = name.toLowerCase()
  if (lower.includes("viagem") || lower.includes("trip")) return "viagem"
  if (lower.includes("car") || lower.includes("veículo") || lower.includes("auto")) return "veiculo"
  if (lower.includes("casa") || lower.includes("home") || lower.includes("moradia")) return "casa"
  return "outro"
}

function mapBudgetColor(percentage: number): string {
  if (percentage >= 90) return "red"
  if (percentage >= 70) return "blue"
  if (percentage >= 40) return "green"
  return "pink"
}

import type { ReleaseCategoryType } from "@/components/release/types"