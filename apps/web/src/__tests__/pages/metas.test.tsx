import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MetasClient } from "@/app/app/metas/metas-client"
import MetasLoading from "@/app/app/metas/loading"
import type { ReleaseGoal } from "@/components/release/types"
import type { ReactNode } from "react"

const mockGoals: ReleaseGoal[] = [
  {
    id: "1",
    name: "Viagem Europa",
    target: 15000,
    current: 5000,
    deadline: "2026-12-31",
    category: "viagem",
  },
  {
    id: "2",
    name: "Fundo de Emergência",
    target: 30000,
    current: 30000,
    category: "outro",
  },
]

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/hooks/use-goals", () => ({
  useCreateGoal: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGoal: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteGoal: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
  it("renderiza goal cards com nomes", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText("Viagem Europa")).toBeInTheDocument()
    expect(screen.getByText("Fundo de Emergência")).toBeInTheDocument()
  })

  it("renderiza título da página", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole("heading", { name: "Metas" })).toBeInTheDocument()
  })

  it("renderiza resumo total e porcentagem global", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText("Total em Metas")).toBeInTheDocument()
    expect(screen.getByText("78%")).toBeInTheDocument()
  })

  it("renderiza valores monetários nos cards", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getAllByText(/5\.000/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/15\.000/).length).toBeGreaterThanOrEqual(1)
  })

  it("renderiza botão Adicionar Meta no header", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText("Adicionar Meta")).toBeInTheDocument()
    expect(screen.getByLabelText("Abrir menu")).toBeInTheDocument()
  })

  it("abre modal ao clicar em Adicionar Meta", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    fireEvent.click(screen.getByText("Adicionar Meta"))
    expect(screen.getByText("Nova Meta")).toBeInTheDocument()
  })

  it("bloqueia meta com valor alvo zero e não exige categoria", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(screen.getByText("Adicionar Meta"))
    fireEvent.change(screen.getByLabelText("Nome da Meta"), { target: { value: "Reserva" } })
    const targetInput = screen.getByLabelText("Valor Alvo")

    fireEvent.blur(targetInput)

    expect(screen.getByText("Informe um valor alvo maior que zero.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled()

    fireEvent.change(targetInput, { target: { value: "abc1500,50" } })

    expect(targetInput).toHaveValue("1500,50")
    expect(screen.getByRole("button", { name: "Salvar" })).not.toBeDisabled()
    expect(screen.queryByText("Categoria")).not.toBeInTheDocument()
  })

  it("usa verde para metas concluídas ou acima de 100% e vermelho para canceladas", () => {
    render(
      <MetasClient
        goals={[
          { ...mockGoals[0], current: 16000, status: "active" },
          { ...mockGoals[1], status: "cancelled" },
        ]}
        totalCurrent={46000}
        totalTarget={45000}
        globalPercentage={102}
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText("107%")).toHaveClass("bg-[var(--rls-secondary-container)]")
    expect(screen.getByText("100%")).toHaveClass("bg-[var(--rls-error-container)]")
  })

  it("renderiza com lista vazia de metas", () => {
    render(
      <MetasClient goals={[]} totalCurrent={0} totalTarget={0} globalPercentage={0} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole("heading", { name: "Metas" })).toBeInTheDocument()
  })
})
