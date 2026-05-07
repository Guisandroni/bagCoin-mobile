import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTransactions, useTransactionSummary, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-transactions"
import type { ReactNode } from "react"

const mockTxList = vi.hoisted(() => ({
  items: [
    { id: "1", name: "Supermercado", category: "Alimentação", amount: -287.5, date: "30 Abr", source: "manual", status: "confirmed", created_at: "2026-04-30T00:00:00Z", updated_at: null },
    { id: "2", name: "Salário", category: "Salário", amount: 8500, date: "28 Abr", source: "auto", status: "confirmed", created_at: "2026-04-28T00:00:00Z", updated_at: null },
    { id: "3", name: "Uber", category: "Transporte", amount: -35, date: "29 Abr", source: "manual", status: "pending", created_at: "2026-04-29T00:00:00Z", updated_at: null },
  ],
  total: 3,
}))

const mockSummaryData = vi.hoisted(() => ({
  balance: 8177.5,
  total_income: 8500,
  total_expenses: 322.5,
  transaction_count: 3,
  categories: [
    { name: "Alimentação", amount: 287.5, color: "#ff6b35" },
    { name: "Transporte", amount: 35, color: "#0052ff" },
  ],
  recent_transactions: mockTxList.items,
}))

// Transactions hook uses apiClient (axios instance) directly, not api wrapper
// We mock the default export (the axios instance)
vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes("summary")) return Promise.resolve({ data: mockSummaryData })
      return Promise.resolve({ data: mockTxList })
    }),
    post: vi.fn().mockImplementation((_url: string, body: any) => {
      const merged = { ...mockTxList.items[0], ...body, id: "99" }
      if (body.description) merged.name = body.description
      return Promise.resolve({ data: merged })
    }),
    patch: vi.fn().mockImplementation((_url: string, body: any) => {
      const merged = { ...mockTxList.items[0], ...body }
      if (body.description) merged.name = body.description
      return Promise.resolve({ data: merged })
    }),
    delete: vi.fn().mockResolvedValue({ data: undefined }),
  },
  api: {
    get: vi.fn().mockResolvedValue(mockTxList),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  getTokenStore: () => ({ getAccessToken: () => null }),
  setAuthCookies: () => {},
  clearAuthCookies: () => {},
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useTransactions", () => {
  it("retorna lista sem filtros", async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(3)
    expect(result.current.data?.total).toBe(3)
  })

  it("retorna com filtro de tipo", async () => {
    const { result } = renderHook(() => useTransactions({ type: "EXPENSE" }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(3)
  })

  it("retorna com busca", async () => {
    const { result } = renderHook(() => useTransactions({ search: "Super" }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items[0].name).toBe("Supermercado")
  })

  it("retorna com paginacao", async () => {
    const { result } = renderHook(() => useTransactions({ skip: 1, limit: 2 }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(3)
  })
})

describe("useTransactionSummary", () => {
  it("retorna sumario do dashboard", async () => {
    const { result } = renderHook(() => useTransactionSummary(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.balance).toBe(8177.5)
    expect(result.current.data?.total_income).toBe(8500)
    expect(result.current.data?.total_expenses).toBe(322.5)
    expect(result.current.data?.transaction_count).toBe(3)
    expect(result.current.data?.categories).toHaveLength(2)
    expect(result.current.data?.recent_transactions).toHaveLength(3)
  })
})

describe("useCreateTransaction", () => {
  it("cria uma transacao", async () => {
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isIdle).toBe(true))
    const res = await result.current.mutateAsync({ type: "EXPENSE", amount: 50, description: "Teste" })
    expect(res.id).toBe("99")
    expect(res.name).toBe("Teste")
  })
})

describe("useUpdateTransaction", () => {
  it("atualiza uma transacao", async () => {
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isIdle).toBe(true))
    const res = await result.current.mutateAsync({ id: "1", description: "Atualizado" })
    expect(res.name).toBe("Atualizado")
  })
})

describe("useDeleteTransaction", () => {
  it("exclui uma transacao", async () => {
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isIdle).toBe(true))
    await expect(result.current.mutateAsync("1")).resolves.toBeUndefined()
  })
})
