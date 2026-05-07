export interface ReleaseProfile {
  name: string
  email: string
  avatarUrl?: string
  phone?: string
  tier?: string
}

export interface ReleaseGoal {
  id: string
  name: string
  target: number
  current: number
  deadline?: string
  category: ReleaseCategoryType
  color?: string
  icon?: string
}

export interface ReleaseBudget {
  id: string
  category: string
  categoryIcon: string
  categoryColor: string
  spent: number
  total: number
  remaining: number
  percentage: number
}

export interface ReleaseTransaction {
  id: string
  name: string
  category: string
  categoryIcon: string
  amount: number
  date: string
  type: "despesa" | "receita"
  source?: string
}

export type ReleaseCategoryType =
  | "viagem"
  | "veiculo"
  | "casa"
  | "outro"
  | "alimentacao"
  | "transporte"
  | "lazer"
  | "saude"
  | "moradia"
  | "investimento"
  | "compras"
  | "receita"

export interface ReleaseCategory {
  name: string
  icon: string
  color: string
  allocated: number
  percentage?: number
  isFixed?: boolean
  type: "despesa" | "receita" | "investimento"
}

export interface ReleaseReport {
  id: string
  name: string
  period: string
  date: string
  status: "concluido" | "arquivado" | "pendente"
  type: "mensal" | "anual" | "imposto" | "custom"
}

export type ReleaseFilterPeriod =
  | "todo"
  | "1d"
  | "1s"
  | "1m"
  | "3m"
  | "1a"

export type ReleaseBudgetType = "meta" | "orcamento"

export interface ReleaseDashboardSummary {
  totalBalance: number
  income: number
  expenses: number
  recentTransactions: ReleaseTransaction[]
  categoryBreakdown: { name: string; percentage: number; color: string }[]
  goals: { name: string; current: number; target: number; percentage: number }[]
}

export interface ReleaseNavItem {
  label: string
  icon: string
  href: string
  isActive?: boolean
}