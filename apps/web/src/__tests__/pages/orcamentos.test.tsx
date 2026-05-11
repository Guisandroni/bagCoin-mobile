import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { OrcamentosClient } from "@/app/app/orcamentos/orcamentos-client"
import OrcamentosLoading from "@/app/app/orcamentos/loading"
import type { ReleaseBudget } from "@/components/release/types"
import type { ReactNode } from "react"

const mockBudgets: ReleaseBudget[] = [
  {
    id: "1",
    category: "Alimentação",
    categoryIcon: "utensils",
    categoryColor: "#22c55e",
    spent: 250,
    total: 1000,
    remaining: 750,
    percentage: 25,
  },
  {
    id: "2",
    category: "Lazer",
    categoryIcon: "gamepad-2",
    categoryColor: "#8b5cf6",
    spent: 100,
    total: 500,
    remaining: 400,
    percentage: 20,
  },
]

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("@/hooks/use-budgets", () => ({
  useCreateBudget: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateBudget: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBudget: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

describe("OrcamentosLoading", () => {
  it("renderiza skeleton loading", () => {
    const { container } = render(<OrcamentosLoading />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })
})

describe("OrcamentosClient", () => {
  it("renderiza budget cards com nomes de categoria", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText("Alimentação")).toBeInTheDocument()
    expect(screen.getByText("Lazer")).toBeInTheDocument()
  })

  it("renderiza título da página", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText("Meus Orçamentos")).toBeInTheDocument()
  })

  it("exibe valores de gasto e total", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText(/R\$\s*350/)).toBeInTheDocument()
  })

  it("renderiza botão Adicionar Novo Orçamento", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText("Adicionar Novo Orçamento")).toBeInTheDocument()
  })

  it("renderiza com lista vazia de orçamentos", () => {
    render(<OrcamentosClient budgets={[]} totalSpent={0} totalBudget={0} />, { wrapper: createWrapper() })
    expect(screen.getByText("Meus Orçamentos")).toBeInTheDocument()
  })
})