import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import MetasPage from "@/app/app/metas/page"
import type { ReactNode } from "react"

// ── Mock data ──────────────────────────────────────────

const mockGoals = {
  items: [
    { id: 1, title: "Viagem Europa", target_amount: 15000, current_amount: 5000, deadline: "2026-12-31T00:00:00Z", status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: null },
    { id: 2, title: "Fundo de Emergência", target_amount: 30000, current_amount: 30000, deadline: null, status: "completed", created_at: "2026-01-01T00:00:00Z", updated_at: null },
  ],
  total: 2,
}

// ── Mocks ──────────────────────────────────────────────

const mockUseGoals = vi.hoisted(() => vi.fn())
const mockCreateGoalMutate = vi.fn()
const mockUpdateGoalMutate = vi.fn()
const mockDeleteGoalMutate = vi.fn()

vi.mock("@/hooks/use-goals", () => ({
  useGoals: mockUseGoals,
  useCreateGoal: () => ({ mutateAsync: mockCreateGoalMutate, isPending: false }),
  useUpdateGoal: () => ({ mutateAsync: mockUpdateGoalMutate, isPending: false }),
  useDeleteGoal: () => ({ mutateAsync: mockDeleteGoalMutate, isPending: false }),
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

describe("MetasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza skeleton loading quando isLoading é true", () => {
    mockUseGoals.mockReturnValue({ data: undefined, isLoading: true, error: null })

    const { container } = render(<MetasPage />, { wrapper: createWrapper() })
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renderiza empty state quando não há metas", () => {
    mockUseGoals.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhuma meta criada")).toBeInTheDocument()
    expect(screen.getByText("Criar Meta")).toBeInTheDocument()
  })

  it("renderiza error state quando há erro", () => {
    mockUseGoals.mockReturnValue({ data: undefined, isLoading: false, error: new Error("Erro de rede") })

    render(<MetasPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Erro ao carregar metas")).toBeInTheDocument()
    expect(screen.getByText("Erro de rede")).toBeInTheDocument()
  })

  it("renderiza goal cards com progress", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Viagem Europa")).toBeInTheDocument()
    expect(screen.getByText("Fundo de Emergência")).toBeInTheDocument()
  })

  it("exibe porcentagem de progresso das metas", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    // 5000/15000 = 33.3%, 30000/30000 = 100%
    expect(screen.getByText("33.3% concluído")).toBeInTheDocument()
    expect(screen.getByText("100.0% concluído")).toBeInTheDocument()
  })

  it("exibe status das metas (Ativa / Concluída)", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Ativa")).toBeInTheDocument()
    expect(screen.getByText("Concluída")).toBeInTheDocument()
  })

  it("exibe prazo da meta quando existe deadline", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/Prazo:/)).toBeInTheDocument()
  })

  it("exibe valores atual e alvo nos cards", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    // "R$ 5.000,00" is the current amount for Viagem Europa
    expect(screen.getAllByText("R$ 5.000,00").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("R$ 15.000,00")).toBeInTheDocument()
    // "R$ 30.000,00" appears twice (current and target are the same for completed goal)
    expect(screen.getAllByText("R$ 30.000,00").length).toBeGreaterThanOrEqual(1)
  })

  it("exibe valor faltante quando a meta não está completa", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    // Viagem Europa: 15000 - 5000 = 10000 still needed
    expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument()
  })

  it("abre dialog de criação ao clicar em Nova Meta", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    // "Nova Meta" appears both as button text and will be dialog title
    const newButtons = screen.getAllByText("Nova Meta")
    fireEvent.click(newButtons[0])
    expect(screen.getByText(/Defina uma nova meta financeira/)).toBeInTheDocument()
  })

  it("abre dialog de edição ao clicar no ícone de editar", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    const editButtons = screen.getAllByRole("button", { name: /editar/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByText("Editar Meta")).toBeInTheDocument()
  })

  it("abre confirmação de delete ao clicar no ícone de excluir", () => {
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText("Excluir Meta")).toBeInTheDocument()
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeInTheDocument()
  })

  it("chama deleteGoal.mutateAsync ao confirmar exclusão", async () => {
    mockDeleteGoalMutate.mockResolvedValueOnce(undefined)
    mockUseGoals.mockReturnValue({ data: mockGoals, isLoading: false, error: null })

    render(<MetasPage />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])

    // Find the confirm button in the alert dialog
    const confirmTexts = screen.getAllByText("Excluir")
    // The last one should be the dialog action (the visible button, not sr-only)
    fireEvent.click(confirmTexts[confirmTexts.length - 1])

    await waitFor(() => {
      expect(mockDeleteGoalMutate).toHaveBeenCalled()
    })
  })
})
