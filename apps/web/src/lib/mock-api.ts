import type {
  TransactionSummary,
  ServerTransaction,
  ServerBudget,
  ServerGoal,
  ServerAccount,
  ServerCreditCard,
  ServerReport,
  ServerConversation,
} from "@/lib/api-server"
import type { TransactionResponse } from "@/hooks/use-transactions"
import type { Budget } from "@/hooks/use-budgets"
import type { Goal } from "@/hooks/use-goals"
import type { AccountResponse } from "@/hooks/use-accounts"
import type { CreditCardResponse } from "@/hooks/use-credit-cards"
import type { Report } from "@/hooks/use-reports"
import type { Conversation, ConversationListResponse, ConversationDetailResponse, Message } from "@/hooks/use-conversations"
import {
  SEED_BALANCE,
  SEED_CATEGORIES,
  SEED_TRANSACTIONS,
  SEED_BUDGETS,
  SEED_GOALS,
  SEED_ACCOUNTS,
  SEED_CREDIT_CARDS,
  SEED_REPORTS,
  SEED_CONVERSATIONS,
} from "@/data/seed"

const SEED_STATS_INCOME = 8500
const SEED_STATS_EXPENSES = 642.5

function mapSource(s: string): string {
  if (s === "WhatsApp") return "whatsapp"
  if (s === "Auto") return "auto"
  return "manual"
}

function mapStatus(s: string): string {
  return s === "Confirmada" ? "confirmed" : "pending"
}

export function seedToTransactionResponse(t: (typeof SEED_TRANSACTIONS)[number]): TransactionResponse {
  return {
    id: String(t.id),
    name: t.name,
    category: t.category,
    amount: t.amount,
    date: t.date,
    source: mapSource(t.source),
    status: mapStatus(t.status),
  }
}

export function seedToServerTransaction(t: (typeof SEED_TRANSACTIONS)[number]): ServerTransaction {
  return {
    id: String(t.id),
    name: t.name,
    category: t.category,
    category_name: t.category,
    amount: t.amount,
    date: t.date,
    transaction_date: t.date,
    source: mapSource(t.source),
    status: mapStatus(t.status),
    type: t.type === "income" ? "INCOME" : "EXPENSE",
  }
}

export function serverTransactionToResponse(t: ServerTransaction): TransactionResponse {
  return {
    id: t.id,
    name: t.name,
    category: t.category_name ?? t.category ?? "",
    amount: t.amount,
    date: t.date ?? t.transaction_date ?? "",
    source: t.source,
    status: t.status,
  }
}

export function getMockTransactionSummary(): TransactionSummary {
  const recent = [...SEED_TRANSACTIONS]
    .filter((t) => t.status === "Confirmada")
    .slice(0, 10)
    .map(seedToServerTransaction)

  return {
    balance: SEED_BALANCE,
    total_income: SEED_STATS_INCOME,
    total_expenses: SEED_STATS_EXPENSES,
    transaction_count: SEED_TRANSACTIONS.length,
    categories: SEED_CATEGORIES.map((c) => ({
      name: c.name,
      amount: c.value,
      color: c.color,
    })),
    recent_transactions: recent,
  }
}

export function getMockTransactionSummaryClient(): {
  balance: number
  total_income: number
  total_expenses: number
  transaction_count: number
  categories: Array<{ name: string; amount: number; color: string }>
  recent_transactions: TransactionResponse[]
} {
  const s = getMockTransactionSummary()
  return {
    balance: s.balance,
    total_income: s.total_income,
    total_expenses: s.total_expenses,
    transaction_count: s.transaction_count,
    categories: s.categories,
    recent_transactions: s.recent_transactions.map(serverTransactionToResponse),
  }
}

export function getMockTransactionsList(): { items: TransactionResponse[]; total: number } {
  const items = SEED_TRANSACTIONS.map(seedToTransactionResponse)
  return { items, total: items.length }
}

export function getMockTransactionsServer(params?: {
  search?: string
  type?: string
  status?: string
  page?: number
  skip?: number
  limit?: number
}): { items: ServerTransaction[]; total: number } | null {
  let items = SEED_TRANSACTIONS.map(seedToServerTransaction)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter((t) => t.name.toLowerCase().includes(q))
  }
  if (params?.type === "INCOME") items = items.filter((t) => t.type === "INCOME")
  if (params?.type === "EXPENSE") items = items.filter((t) => t.type === "EXPENSE")
  if (params?.status === "confirmed") items = items.filter((t) => t.status === "confirmed")
  if (params?.status === "pending") items = items.filter((t) => t.status === "pending")
  const total = items.length
  const limit = params?.limit ?? 100
  const skip =
    params?.skip ??
    (params?.page != null && params.page > 0 ? (params.page - 1) * limit : 0)
  items = items.slice(skip, skip + limit)
  return { items, total }
}

export function getMockTransactionsClient(filters?: {
  type?: string
  search?: string
  skip?: number
  limit?: number
}): { items: TransactionResponse[]; total: number } {
  const upper = filters?.type?.toUpperCase()
  const typeFilter =
    upper === "INCOME" || upper === "EXPENSE" ? (upper as "INCOME" | "EXPENSE") : undefined
  const res = getMockTransactionsServer({
    search: filters?.search,
    type: typeFilter,
    skip: filters?.skip,
    limit: filters?.limit ?? 50,
  })
  if (!res) return { items: [], total: 0 }
  return {
    items: res.items.map(serverTransactionToResponse),
    total: res.total,
  }
}

const PERIOD_MAP: Record<string, string> = {
  Mensal: "monthly",
  Semanal: "weekly",
  Anual: "yearly",
}

function seedBudgetToBudget(b: (typeof SEED_BUDGETS)[number]): Budget {
  const pct = Math.min(100, (b.spent / b.amount_limit) * 100)
  return {
    id: b.id,
    name: b.name,
    period: PERIOD_MAP[b.period] ?? "monthly",
    total_limit: b.amount_limit,
    total_spent: b.spent,
    total_remaining: b.amount_limit - b.spent,
    percentage: pct,
    budget_type: "category",
    category_id: null,
    category_name: b.category,
    created_at: "2026-05-01T12:00:00Z",
    updated_at: null,
  }
}

export function getMockBudgetsList(): Budget[] {
  return SEED_BUDGETS.map(seedBudgetToBudget)
}

export function getMockBudgetsServer(): ServerBudget[] {
  return getMockBudgetsList()
}

export function getMockBudgetById(id: number): Budget | null {
  return getMockBudgetsList().find((b) => b.id === id) ?? null
}

function goalStatusSeedToApi(s: string): Goal["status"] {
  if (s === "Concluída") return "completed"
  if (s === "Cancelada") return "cancelled"
  return "active"
}

export function getMockGoalsList(): Goal[] {
  return SEED_GOALS.map((g) => ({
    id: g.id,
    title: g.name,
    target_amount: g.target_amount,
    current_amount: g.current_amount,
    deadline: g.deadline,
    status: goalStatusSeedToApi(g.status),
    created_at: "2026-05-01T12:00:00Z",
    updated_at: null,
  }))
}

export function getMockGoalById(id: number): Goal | null {
  return getMockGoalsList().find((g) => g.id === id) ?? null
}

export function getMockGoalsServer(): ServerGoal[] {
  return SEED_GOALS.map((g) => {
    const pct = Math.min(100, (g.current_amount / g.target_amount) * 100)
    return {
      id: g.id,
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      remaining_amount: Math.max(0, g.target_amount - g.current_amount),
      percentage: pct,
      status: goalStatusSeedToApi(g.status),
      deadline: g.deadline,
      created_at: "2026-05-01T12:00:00Z",
      updated_at: null,
    }
  })
}

function accountTypeToApi(t: string): "CHECKING" | "SAVINGS" {
  const lower = t.toLowerCase()
  if (lower.includes("poupan") || lower.includes("invest")) return "SAVINGS"
  return "CHECKING"
}

export function getMockAccounts(): AccountResponse[] {
  return SEED_ACCOUNTS.map((a) => ({
    id: a.id,
    name: a.name,
    type: accountTypeToApi(a.type),
    balance: a.balance,
    bank: a.institution,
    color: "#578bfa",
    created_at: "2026-05-01T12:00:00Z",
  }))
}

export function getMockAccountsServer(): ServerAccount[] {
  return SEED_ACCOUNTS.map((a) => ({
    id: String(a.id),
    name: a.name,
    bank: a.institution,
    type: accountTypeToApi(a.type),
    balance: a.balance,
    color: "#578bfa",
    active: true,
    created_at: "2026-05-01T12:00:00Z",
  }))
}

export function getMockCreditCards(): CreditCardResponse[] {
  return SEED_CREDIT_CARDS.map((c) => ({
    id: c.id,
    name: c.name,
    limit: c.limit,
    closing_day: 1,
    due_day: c.due_day,
    issuer: c.brand,
    color: "#578bfa",
    created_at: "2026-05-01T12:00:00Z",
  }))
}

export function getMockCreditCardsServer(): ServerCreditCard[] {
  return SEED_CREDIT_CARDS.map((c) => ({
    id: String(c.id),
    name: c.name,
    issuer: c.brand,
    limit: c.limit,
    closing_day: 1,
    due_day: c.due_day,
    color: "#578bfa",
    active: true,
    created_at: "2026-05-01T12:00:00Z",
  }))
}

export function getMockReports(): Report[] {
  return SEED_REPORTS.map((r) => ({
    id: r.id,
    user_uuid: null,
    period_start: r.created_at,
    period_end: r.created_at,
    file_url: r.file_url === "#" ? "https://example.com/report.pdf" : r.file_url,
    created_at: r.created_at,
    updated_at: r.created_at,
  }))
}

export function getMockReportsServer(): ServerReport[] {
  return getMockReports().map((r) => ({
    id: r.id,
    user_uuid: r.user_uuid,
    period_start: r.period_start,
    period_end: r.period_end,
    file_url: r.file_url,
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
  }))
}

export function getMockReportById(id: number): Report | null {
  return getMockReports().find((r) => r.id === id) ?? null
}

const MOCK_CONV_IDS = ["mock-conv-1", "mock-conv-2", "mock-conv-3"] as const

function conversationIndexFromId(id: string): number {
  const m = /^mock-conv-(\d+)$/.exec(id)
  if (m) {
    const n = Number(m[1])
    if (n >= 1 && n <= SEED_CONVERSATIONS.length) return n - 1
  }
  const bySeed = SEED_CONVERSATIONS.findIndex((c) => String(c.id) === id)
  return bySeed
}

export function getMockConversationsList(): ConversationListResponse {
  const items: Conversation[] = SEED_CONVERSATIONS.map((c, i) => ({
    id: MOCK_CONV_IDS[i] ?? `mock-conv-${c.id}`,
    title: c.user_phone,
    user_id: "mock-user",
    is_archived: false,
    created_at: "2026-05-01T12:00:00Z",
    updated_at: "2026-05-04T12:00:00Z",
  }))
  return { items, total: items.length }
}

export function getMockConversationsServer(): ServerConversation[] {
  return SEED_CONVERSATIONS.map((c, i) => ({
    id: MOCK_CONV_IDS[i] ?? `mock-conv-${c.id}`,
    phone_number: c.user_phone,
    platform: "whatsapp",
    status: c.pending > 0 ? "pending" : "active",
    message_count: c.messages.length,
    last_message: c.last_message,
    last_message_at: "2026-05-04T12:00:00Z",
    created_at: "2026-05-01T12:00:00Z",
  }))
}

export function getMockConversationDetail(id: string): ConversationDetailResponse | null {
  const i = conversationIndexFromId(id)
  const conv = i >= 0 ? SEED_CONVERSATIONS[i] : undefined
  if (!conv) return null

  const cid = MOCK_CONV_IDS[i] ?? `mock-conv-${conv.id}`
  const messages: Message[] = conv.messages.map((m, mi) => ({
    id: `${cid}-msg-${mi}`,
    conversation_id: cid,
    role: m.from === "user" ? "user" : "assistant",
    content: m.text,
    created_at: "2026-05-04T12:00:00Z",
    updated_at: "2026-05-04T12:00:00Z",
  }))

  return {
    id: cid,
    title: conv.user_phone,
    user_id: "mock-user",
    is_archived: false,
    created_at: "2026-05-01T12:00:00Z",
    updated_at: "2026-05-04T12:00:00Z",
    messages,
  }
}
