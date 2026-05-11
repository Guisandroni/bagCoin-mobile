import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
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
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
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
    expect(screen.getByText("Minhas Metas")).toBeInTheDocument()
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

  it("renderiza botão Adicionar Nova Meta", () => {
    render(
      <MetasClient goals={mockGoals} totalCurrent={35000} totalTarget={45000} globalPercentage={78} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText("Adicionar Nova Meta")).toBeInTheDocument()
  })

  it("renderiza com lista vazia de metas", () => {
    render(
      <MetasClient goals={[]} totalCurrent={0} totalTarget={0} globalPercentage={0} />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText("Minhas Metas")).toBeInTheDocument()
  })
})