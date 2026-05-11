import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { OrcamentosClient } from "@/app/app/orcamentos/orcamentos-client"
import OrcamentosLoading from "@/app/app/orcamentos/loading"
import type { ReleaseBudget } from "@/components/release/types"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  createBudget: vi.fn(),
}))

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
  {
    id: "3",
    category: "Moradia",
    categoryIcon: "home",
    categoryColor: "#45B7D1",
    spent: 1200,
    total: 1000,
    remaining: -200,
    percentage: 120,
  },
]

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/hooks/use-budgets", () => ({
  useCreateBudget: () => ({ mutateAsync: mocks.createBudget, isPending: false }),
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
  beforeEach(() => {
    mocks.createBudget.mockReset()
    mocks.createBudget.mockResolvedValue({})
  })

  it("renderiza budget cards com nomes de categoria", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText("Alimentação")).toBeInTheDocument()
    expect(screen.getByText("Lazer")).toBeInTheDocument()
  })

  it("exibe orçamento acima do limite sem valor negativo", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={1550} totalBudget={2500} />, { wrapper: createWrapper() })
    expect(screen.getByText("R$ 200,00 acima do limite")).toBeInTheDocument()
    expect(screen.queryByText("-R$ 200,00 restantes")).not.toBeInTheDocument()
  })

  it("renderiza título da página", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByRole("heading", { name: "Orçamentos" })).toBeInTheDocument()
  })

  it("exibe valores de gasto e total", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText(/R\$\s*350/)).toBeInTheDocument()
  })

  it("renderiza botão Adicionar Orçamento no header", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    expect(screen.getByText("Adicionar Orçamento")).toBeInTheDocument()
    expect(screen.getByLabelText("Abrir menu")).toBeInTheDocument()
  })

  it("abre modal ao clicar em Adicionar Orçamento", () => {
    render(<OrcamentosClient budgets={mockBudgets} totalSpent={350} totalBudget={1500} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Adicionar Orçamento"))
    expect(screen.getByText("Novo Orçamento")).toBeInTheDocument()
  })

  it("envia orçamento com período semanal", async () => {
    render(
      <OrcamentosClient
        budgets={mockBudgets}
        categories={[
          { id: 1, name: "Alimentação", icon: "🍽️", color: "#FF6B6B", allocated: 0, type: "despesa", isFixed: true },
          { id: 2, name: "Viagem", icon: "✈️", color: "#3498DB", allocated: 0, type: "despesa", isFixed: false },
        ]}
        totalSpent={350}
        totalBudget={1500}
      />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(screen.getByText("Adicionar Orçamento"))
    fireEvent.click(screen.getByText("Semanal"))
    fireEvent.change(screen.getByLabelText("Pesquisar categorias"), {
      target: { value: "via" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Viagem/ }))
    fireEvent.change(screen.getByLabelText("Limite semanal"), {
      target: { value: "750,00" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(mocks.createBudget).toHaveBeenCalledWith({
        name: "Viagem",
        category_id: 2,
        category_name: "Viagem",
        period: "weekly",
        total_limit: 750,
        budget_type: "category",
      })
    })
  })

  it("não permite criar orçamento digitando categoria inexistente", () => {
    render(
      <OrcamentosClient
        budgets={mockBudgets}
        categories={[
          { id: 1, name: "Alimentação", icon: "🍽️", color: "#FF6B6B", allocated: 0, type: "despesa", isFixed: true },
        ]}
        totalSpent={350}
        totalBudget={1500}
      />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(screen.getByText("Adicionar Orçamento"))
    fireEvent.change(screen.getByLabelText("Pesquisar categorias"), {
      target: { value: "Categoria Nova" },
    })
    fireEvent.change(screen.getByLabelText("Limite mensal"), {
      target: { value: "500,00" },
    })

    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled()
    expect(screen.getByText("Nenhuma categoria encontrada.")).toBeInTheDocument()
  })

  it("renderiza com lista vazia de orçamentos", () => {
    render(<OrcamentosClient budgets={[]} totalSpent={0} totalBudget={0} />, { wrapper: createWrapper() })
    expect(screen.getByRole("heading", { name: "Orçamentos" })).toBeInTheDocument()
  })
})
