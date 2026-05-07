import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import OrcamentosPage from "@/app/app/orcamentos/page"
import type { ReactNode } from "react"

// ── Mock data ──────────────────────────────────────────

const mockBudgets = {
  items: [
    { id: 1, name: "Mercado Mensal", period: "monthly", total_limit: 1000, total_spent: 250, total_remaining: 750, percentage: 25, budget_type: "general", category_id: 1, category_name: "Alimentação", created_at: "2026-04-01T00:00:00Z", updated_at: null },
    { id: 2, name: "Lazer", period: "monthly", total_limit: 500, total_spent: 100, total_remaining: 400, percentage: 20, budget_type: "general", category_id: null, category_name: null, created_at: "2026-04-01T00:00:00Z", updated_at: null },
  ],
  total: 2,
}

// ── Mocks ──────────────────────────────────────────────

const mockUseBudgets = vi.hoisted(() => vi.fn())
const mockCreateBudgetMutate = vi.fn()
const mockUpdateBudgetMutate = vi.fn()
const mockDeleteBudgetMutate = vi.fn()

vi.mock("@/hooks/use-budgets", () => ({
  useBudgets: mockUseBudgets,
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

// ── Tests ──────────────────────────────────────────────

describe("OrcamentosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza skeleton loading quando isLoading é true", () => {
    mockUseBudgets.mockReturnValue({ data: undefined, isLoading: true, error: null })

    const { container } = render(<OrcamentosPage />, { wrapper: createWrapper() })
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renderiza empty state quando não há orçamentos", () => {
    mockUseBudgets.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhum orçamento criado")).toBeInTheDocument()
    // There are two buttons with "Criar Orçamento" - one in empty state, but it renders once
    expect(screen.getAllByText("Criar Orçamento")).toHaveLength(1)
  })

  it("renderiza error state quando há erro", () => {
    mockUseBudgets.mockReturnValue({ data: undefined, isLoading: false, error: new Error("Falha na conexão") })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Erro ao carregar orçamentos")).toBeInTheDocument()
    expect(screen.getByText("Falha na conexão")).toBeInTheDocument()
  })

  it("renderiza budget cards com progress", () => {
    mockUseBudgets.mockReturnValue({ data: mockBudgets, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Mercado Mensal")).toBeInTheDocument()
    expect(screen.getByText("Lazer")).toBeInTheDocument()
    // Check for percentage text
    expect(screen.getByText("25.0% utilizado")).toBeInTheDocument()
    expect(screen.getByText("20.0% utilizado")).toBeInTheDocument()
    // Each budget is monthly, so "Mensal" appears twice
    expect(screen.getAllByText("Mensal")).toHaveLength(2)
  })

  it("exibe valores de gasto, limite e restante nos cards", () => {
    mockUseBudgets.mockReturnValue({ data: mockBudgets, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    // Spent values
    expect(screen.getByText("R$ 250,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument()
    // Limit values
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument()
    // Remaining values
    expect(screen.getByText("R$ 750,00")).toBeInTheDocument()
    expect(screen.getByText("R$ 400,00")).toBeInTheDocument()
  })

  it("abre dialog de criação ao clicar em Novo Orçamento", () => {
    mockUseBudgets.mockReturnValue({ data: mockBudgets, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    // The button text is "Novo Orçamento" - find the header button specifically
    const newButton = screen.getAllByText("Novo Orçamento")
    // First one is the header button, second would be dialog title (not yet visible)
    fireEvent.click(newButton[0])
    // Dialog title is also "Novo Orçamento"
    expect(screen.getAllByText("Novo Orçamento").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Preencha os dados para criar/)).toBeInTheDocument()
  })

  it("abre dialog de edição ao clicar no ícone de editar", () => {
    mockUseBudgets.mockReturnValue({ data: mockBudgets, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    const editButtons = screen.getAllByRole("button", { name: /editar/i })
    fireEvent.click(editButtons[0])
    // Confirm dialog opened by checking the title
    expect(screen.getByText("Editar Orçamento")).toBeInTheDocument()
    // The form name label should be present
    expect(screen.getByText("Nome")).toBeInTheDocument()
  })

  it("abre confirmação de delete ao clicar no ícone de excluir", () => {
    mockUseBudgets.mockReturnValue({ data: mockBudgets, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    // Find the delete button (sr-only span with "Excluir")
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText("Excluir Orçamento")).toBeInTheDocument()
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeInTheDocument()
  })

  it("chama deleteBudget.mutateAsync ao confirmar exclusão", async () => {
    mockDeleteBudgetMutate.mockResolvedValueOnce(undefined)
    mockUseBudgets.mockReturnValue({ data: mockBudgets, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])

    // In the alert dialog, there are two "Excluir" texts: button sr-only and dialog action
    // Click the one that is the dialog action button
    const confirmButtons = screen.getAllByText("Excluir")
    // The dialog action button is the visible one (not sr-only)
    const dialogAction = confirmButtons.find(b =>
      b.classList.contains("bg-destructive") || b.closest?.("button")?.classList.contains("bg-destructive")
    ) || confirmButtons[confirmButtons.length - 1]

    fireEvent.click(dialogAction)

    await waitFor(() => {
      expect(mockDeleteBudgetMutate).toHaveBeenCalled()
    })
  })

  it("abre dialog de criação pelo empty state", () => {
    mockUseBudgets.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false, error: null })

    render(<OrcamentosPage />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Criar Orçamento"))
    // After clicking, dialog opens and "Novo Orçamento" appears
    expect(screen.getAllByText("Novo Orçamento").length).toBeGreaterThanOrEqual(1)
  })
})
