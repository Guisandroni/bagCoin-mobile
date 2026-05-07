import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import OrcamentosClient from "@/app/app/orcamentos/orcamentos-client"
import OrcamentosLoading from "@/app/app/orcamentos/loading"
import type { ServerBudget } from "@/lib/api-server"
import type { ReactNode } from "react"

const mockBudgets: ServerBudget[] = [
  {
    id: 1,
    name: "Mercado Mensal",
    period: "monthly",
    total_limit: 1000,
    total_spent: 250,
    total_remaining: 750,
    percentage: 25,
    budget_type: "general",
    category_id: 1,
    category_name: "Alimentação",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: 2,
    name: "Lazer",
    period: "monthly",
    total_limit: 500,
    total_spent: 100,
    total_remaining: 400,
    percentage: 20,
    budget_type: "general",
    category_id: null,
    category_name: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: null,
  },
]

const mockCreateBudgetMutate = vi.fn()
const mockUpdateBudgetMutate = vi.fn()
const mockDeleteBudgetMutate = vi.fn()

vi.mock("@/hooks/use-budgets", () => ({
  useCreateBudget: () => ({ mutateAsync: mockCreateBudgetMutate, isPending: false }),
  useUpdateBudget: () => ({ mutateAsync: mockUpdateBudgetMutate, isPending: false }),
  useDeleteBudget: () => ({ mutateAsync: mockDeleteBudgetMutate, isPending: false }),
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
    vi.clearAllMocks()
  })

  it("renderiza empty state quando não há orçamentos", () => {
    render(<OrcamentosClient serverBudgets={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhum orçamento criado")).toBeInTheDocument()
    expect(screen.getAllByText("Criar Orçamento")).toHaveLength(1)
  })

  it("renderiza budget cards com progress", () => {
    render(<OrcamentosClient serverBudgets={mockBudgets} />, { wrapper: createWrapper() })
    expect(screen.getByText("Mercado Mensal")).toBeInTheDocument()
    expect(screen.getByText("Lazer")).toBeInTheDocument()
    expect(screen.getByText("25.0% do limite")).toBeInTheDocument()
    expect(screen.getByText("20.0% do limite")).toBeInTheDocument()
    expect(screen.getAllByText("Mensal")).toHaveLength(2)
  })

  it("exibe valores de gasto, limite e restante nos cards", () => {
    render(<OrcamentosClient serverBudgets={mockBudgets} />, { wrapper: createWrapper() })
    expect(screen.getByText("R$ 250,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 750,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 400,00")).toBeInTheDocument()
  })

  it("abre dialog de criação ao clicar no FAB Novo orçamento", () => {
    render(<OrcamentosClient serverBudgets={mockBudgets} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByLabelText("Novo orçamento"))
    expect(screen.getByText(/Preencha os dados para criar/)).toBeInTheDocument()
  })

  it("abre dialog de edição ao clicar no ícone de editar", () => {
    render(<OrcamentosClient serverBudgets={mockBudgets} />, { wrapper: createWrapper() })
    const editButtons = screen.getAllByRole("button", { name: /editar/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByText("Editar Orçamento")).toBeInTheDocument()
    expect(screen.getByText("Nome")).toBeInTheDocument()
  })

  it("abre confirmação de delete ao clicar no ícone de excluir", () => {
    render(<OrcamentosClient serverBudgets={mockBudgets} />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText("Excluir Orçamento")).toBeInTheDocument()
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeInTheDocument()
  })

  it("chama deleteBudget.mutateAsync ao confirmar exclusão", async () => {
    mockDeleteBudgetMutate.mockResolvedValueOnce(undefined)
    render(<OrcamentosClient serverBudgets={mockBudgets} />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])

    const confirmButtons = screen.getAllByText("Excluir")
    const dialogAction =
      confirmButtons.find(
        (el) =>
          el.closest("button")?.classList.contains("bg-destructive") ||
          el.classList.contains("bg-destructive")
      ) || confirmButtons[confirmButtons.length - 1]

    fireEvent.click(dialogAction)

    await waitFor(() => {
      expect(mockDeleteBudgetMutate).toHaveBeenCalled()
    })
  })

  it("abre dialog de criação pelo empty state", () => {
    render(<OrcamentosClient serverBudgets={[]} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Criar Orçamento"))
    expect(screen.getAllByText("Novo Orçamento").length).toBeGreaterThanOrEqual(1)
  })
})
