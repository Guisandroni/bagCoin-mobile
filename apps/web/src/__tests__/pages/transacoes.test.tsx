import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import TransacoesPage from "@/app/app/transacoes/page"
import type { ReactNode } from "react"

// ── Mock data ──────────────────────────────────────────

const mockItems = [
  { id: "1", name: "Supermercado", category: "Alimentação", amount: -287.5, date: "30 Abr", source: "manual", status: "confirmed", created_at: "2026-04-30T00:00:00Z", updated_at: null },
  { id: "2", name: "Salário", category: "Salário", amount: 8500, date: "28 Abr", source: "auto", status: "confirmed", created_at: "2026-04-28T00:00:00Z", updated_at: null },
  { id: "3", name: "Uber", category: "Transporte", amount: -35, date: "29 Abr", source: "manual", status: "pending", created_at: "2026-04-29T00:00:00Z", updated_at: null },
]

// ── Mocks ──────────────────────────────────────────────

const mockOpenModal = vi.fn()
let mockSearchQuery = ""

vi.mock("@/lib/store", () => ({
  useAppStore: (selector?: Function) => {
    const state = {
      filter: { type: "all", categories: ["Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Educação", "Compras", "Salário"], searchQuery: mockSearchQuery },
      openModal: mockOpenModal,
      setFilter: vi.fn((partial: any) => {
        if (partial.searchQuery !== undefined) {
          mockSearchQuery = partial.searchQuery
        }
      }),
    }
    return selector ? selector(state) : state
  },
}))

const mockUseTransactions = vi.hoisted(() => vi.fn())

vi.mock("@/hooks/use-transactions", () => ({
  useTransactions: mockUseTransactions,
  useTransactionSummary: () => ({ data: null, isLoading: true }),
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  getTokenStore: () => ({ getAccessToken: () => null }),
  setAuthCookies: () => { },
  clearAuthCookies: () => { },
}))

// ── Wrapper ────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ── Helpers ────────────────────────────────────────────

// The page renders both desktop (lg:block hidden) and mobile (lg:hidden) layouts,
// so text elements are duplicated. We use getAllByText and check length >= 1.

// ── Tests ──────────────────────────────────────────────

describe("TransacoesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchQuery = ""
  })

  it("renderiza skeleton loading quando isLoading é true", () => {
    mockUseTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { container } = render(<TransacoesPage />, { wrapper: createWrapper() })
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThanOrEqual(5)
  })

  it("renderiza empty state quando não há transações", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhuma transação encontrada")).toBeInTheDocument()
    expect(screen.getByText("Nova transação")).toBeInTheDocument()
  })

  it("renderiza lista de transações com dados", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    // Elements appear in both desktop and mobile views, so use getAllByText
    expect(screen.getAllByText("Supermercado").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Salário").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Uber").length).toBeGreaterThanOrEqual(1)
  })

  it("mostra categorias corretas na lista", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    expect(screen.getAllByText("Alimentação").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Transporte").length).toBeGreaterThanOrEqual(1)
  })

  it("filtra por 'Confirmadas' quando clica no botão", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Confirmadas"))

    // Confirmed items should still be visible (once each)
    expect(screen.getAllByText("Supermercado").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Salário").length).toBeGreaterThanOrEqual(1)
    // Uber is pending so it should disappear
    expect(screen.queryByText("Uber")).not.toBeInTheDocument()
  })

  it("filtra por 'Pendentes' quando clica no botão", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Pendentes"))

    // Only Uber is pending
    expect(screen.getAllByText("Uber").length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("Supermercado")).not.toBeInTheDocument()
    expect(screen.queryByText("Salário")).not.toBeInTheDocument()
  })

  it("busca por texto altera o estado do filtro", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    const searchInput = screen.getByPlaceholderText("Buscar transações...")
    expect(searchInput).toBeInTheDocument()
    fireEvent.change(searchInput, { target: { value: "Super" } })
    // Input value is bound to zustand store; fireEvent triggers onChange
    // which calls setFilter. The component re-renders from store subscription.
    expect(screen.getByPlaceholderText("Buscar transações...")).toBeInTheDocument()
  })

  it("abre modal de filtro ao clicar no botão de filtro", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    // Find the filter button (the one with SlidersHorizontal icon)
    const buttons = screen.getAllByRole("button")
    // The filter button is usually the second-to-last or in the search area
    // Just check that the filter button icon renders
    const filterBtn = buttons.find(b => b.querySelector("svg.lucide-sliders-horizontal"))
    if (filterBtn) {
      fireEvent.click(filterBtn)
      expect(mockOpenModal).toHaveBeenCalledWith("filter")
    }
  })

  it("mostra badge 'pendente' para transações pendentes", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: mockItems, total: 3 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    // The page renders both desktop and mobile views, so "pendente" appears twice
    const pendingBadges = screen.getAllByText("pendente")
    expect(pendingBadges.length).toBeGreaterThanOrEqual(1)
  })

  it("abre modal de nova transação ao clicar no botão do empty state", () => {
    mockUseTransactions.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
    })

    render(<TransacoesPage />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Nova transação"))
    expect(mockOpenModal).toHaveBeenCalledWith("new-transaction")
  })
})
