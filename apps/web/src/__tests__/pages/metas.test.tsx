import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MetasClient, type MetasGoal } from "@/app/app/metas/metas-client"
import MetasLoading from "@/app/app/metas/loading"
import type { ReactNode } from "react"

const mockGoals: MetasGoal[] = [
  {
    id: 1,
    title: "Viagem Europa",
    target_amount: 15000,
    current_amount: 5000,
    deadline: "2026-12-31T00:00:00Z",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: 2,
    title: "Fundo de Emergência",
    target_amount: 30000,
    current_amount: 30000,
    deadline: null,
    status: "completed",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
]

const mockCreateGoalMutate = vi.fn()
const mockUpdateGoalMutate = vi.fn()
const mockDeleteGoalMutate = vi.fn()

vi.mock("@/hooks/use-goals", () => ({
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
  setAuthCookies: () => {},
  clearAuthCookies: () => {},
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("MetasLoading", () => {
  it("renderiza skeleton loading", () => {
    const { container } = render(<MetasLoading />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })
})

describe("MetasClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza empty state quando não há metas", () => {
    render(<MetasClient initialGoals={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhuma meta criada")).toBeInTheDocument()
    expect(screen.getByText("Criar Meta")).toBeInTheDocument()
  })

  it("renderiza goal cards com progress", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    expect(screen.getByText("Viagem Europa")).toBeInTheDocument()
    expect(screen.getByText("Fundo de Emergência")).toBeInTheDocument()
  })

  it("exibe porcentagem de progresso das metas", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    expect(screen.getByText("33.3% concluído")).toBeInTheDocument()
    expect(screen.getByText("Concluída")).toBeInTheDocument()
  })

  it("exibe status das metas (Ativa / Concluída)", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    expect(screen.getByText("Ativa")).toBeInTheDocument()
    expect(screen.getByText("Concluída")).toBeInTheDocument()
  })

  it("exibe prazo da meta quando existe deadline", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    expect(screen.getByText(/Prazo:/)).toBeInTheDocument()
  })

  it("exibe valores atual e alvo nos cards", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    expect(screen.getAllByText(/R\$\s*5\.000,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/R\$\s*15\.000,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/R\$\s*30\.000,00/).length).toBeGreaterThanOrEqual(1)
  })

  it("exibe valor faltante quando a meta não está completa", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    expect(screen.getByText(/R\$\s*10\.000,00/)).toBeInTheDocument()
  })

  it("abre dialog de criação ao clicar em Nova Meta", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByRole("button", { name: /nova/i }))
    expect(screen.getByText(/Defina uma nova meta financeira/)).toBeInTheDocument()
  })

  it("abre dialog de edição ao clicar no ícone de editar", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    const editButtons = screen.getAllByRole("button", { name: /editar/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByText("Editar Meta")).toBeInTheDocument()
  })

  it("abre confirmação de delete ao clicar no ícone de excluir", () => {
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText("Excluir Meta")).toBeInTheDocument()
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeInTheDocument()
  })

  it("chama deleteGoal.mutateAsync ao confirmar exclusão", async () => {
    mockDeleteGoalMutate.mockResolvedValueOnce(undefined)
    render(<MetasClient initialGoals={mockGoals} />, { wrapper: createWrapper() })
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i })
    fireEvent.click(deleteButtons[0])

    const confirmTexts = screen.getAllByText("Excluir")
    fireEvent.click(confirmTexts[confirmTexts.length - 1])

    await waitFor(() => {
      expect(mockDeleteGoalMutate).toHaveBeenCalled()
    })
  })
})
