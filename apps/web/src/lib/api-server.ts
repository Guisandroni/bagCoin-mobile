import { cookies } from "next/headers"
import { USE_MOCK_DATA } from "@/lib/feature-flags"
import * as mock from "@/lib/mock-api"

/** Prefer API_URL (server); fall back to NEXT_PUBLIC_API_URL then local dev default. */
const API_BASE =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

/**
 * Fetch data from the backend API from a Server Component.
 * Reads the JWT from cookies and passes it as Bearer token.
 */
async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      next: { revalidate: 60 },
    } as RequestInit & { next?: { revalidate?: number } })

    if (!res.ok) {
      if (res.status === 401) return null as T
      throw new Error(`API error ${res.status}: ${res.statusText}`)
    }

    return res.json() as Promise<T>
  } catch (err) {
    // Network error during build or backend unreachable — return null
    if (process.env.NODE_ENV === "production") {
      console.error(`[api-server] fetch failed for ${path}:`, (err as Error).message)
    }
    return null as T
  }
}

// ── Typed data fetchers ──────────────────────────────────

export interface ServerTransaction {
  id: string
  type?: "INCOME" | "EXPENSE"
  name: string
  description?: string
  category?: string
  category_name?: string
  amount: number
  date?: string
  transaction_date?: string
  source: string
  status: string
}

export interface TransactionSummary {
  balance: number
  total_income: number
  total_expenses: number
  transaction_count: number
  categories: Array<{ name: string; amount: number; color: string }>
  recent_transactions: ServerTransaction[]
}

export async function getTransactionSummary(): Promise<TransactionSummary | null> {
  if (USE_MOCK_DATA) return mock.getMockTransactionSummary()
  return serverFetch<TransactionSummary>("/bagcoin/transactions/summary")
}

export async function getTransactions(params?: {
  search?: string
  type?: string
  status?: string
  page?: number
  skip?: number
  limit?: number
}): Promise<{ items: ServerTransaction[]; total: number } | null> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set("search", params.search)
  if (params?.type) qs.set("type", params.type)
  if (params?.status) qs.set("status", params.status)
  if (params?.page) qs.set("page", String(params.page))
  if (params?.skip !== undefined) qs.set("skip", String(params.skip))
  if (params?.limit) qs.set("limit", String(params.limit))
  const query = qs.toString()
  if (USE_MOCK_DATA) return mock.getMockTransactionsServer(params) ?? null
  return serverFetch(`/bagcoin/transactions${query ? `?${query}` : ""}`)
}

export interface ServerBudget {
  id: number
  name: string
  period: string
  total_limit: number
  total_spent: number
  total_remaining: number
  percentage: number
  budget_type: string
  category_id: number | null
  category_name: string | null
  created_at: string
  updated_at: string | null
}

export async function getBudgets(): Promise<ServerBudget[] | null> {
  if (USE_MOCK_DATA) return mock.getMockBudgetsServer()
  return serverFetch("/bagcoin/budgets")
}

export interface ServerGoal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  remaining_amount: number
  percentage: number
  status: "active" | "completed" | "cancelled"
  deadline: string | null
  created_at: string
  updated_at: string | null
}

export async function getGoals(): Promise<ServerGoal[] | null> {
  if (USE_MOCK_DATA) return mock.getMockGoalsServer()
  return serverFetch("/bagcoin/goals")
}

export interface ServerAccount {
  id: string
  name: string
  bank: string
  type: "CHECKING" | "SAVINGS"
  balance: number
  color: string
  active: boolean
  created_at: string
}

export async function getAccounts(): Promise<ServerAccount[] | null> {
  if (USE_MOCK_DATA) return mock.getMockAccountsServer()
  return serverFetch("/bagcoin/accounts")
}

export interface ServerCreditCard {
  id: string
  name: string
  issuer: string
  limit: number
  closing_day: number
  due_day: number
  color: string
  active: boolean
  created_at: string
}

export async function getCreditCards(): Promise<ServerCreditCard[] | null> {
  if (USE_MOCK_DATA) return mock.getMockCreditCardsServer()
  return serverFetch("/bagcoin/credit-cards")
}

export interface ServerReport {
  id: number
  user_uuid: string | null
  period_start: string
  period_end: string
  file_url: string | null
  created_at: string
  updated_at: string
}

export async function getReports(): Promise<ServerReport[] | null> {
  if (USE_MOCK_DATA) return mock.getMockReportsServer()
  return serverFetch("/bagcoin/reports")
}

export interface ServerConversation {
  id: string
  phone_number: string
  platform: string
  status: string
  message_count: number
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

export async function getConversations(): Promise<ServerConversation[] | null> {
  if (USE_MOCK_DATA) return mock.getMockConversationsServer()
  return serverFetch("/bagcoin/conversations")
}
