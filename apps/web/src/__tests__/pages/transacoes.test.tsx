import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TransacoesClient } from "@/app/app/transacoes/transacoes-client"
import TransacoesLoading from "@/app/app/transacoes/loading"
import type { ReactNode } from "react"
import type { ReleaseTransaction } from "@/components/release/types"

const mockItems: ReleaseTransaction[] = [
  {
    id: "1",
    name: "Supermercado",
    category: "Alimentação",
    categoryIcon: "shopping-cart",
    amount: -287.5,
    date: "30 Abr",
    type: "despesa",
    source: "manual",
  },
  {
    id: "2",
    name: "Salário",
    category: "Salário",
    categoryIcon: "banknote",
    amount: 8500,
    date: "28 Abr",
    type: "receita",
    source: "auto",
  },
  {
    id: "3",
    name: "Uber",
    category: "Transporte",
    categoryIcon: "car",
    amount: -35,
    date: "29 Abr",
    type: "despesa",
    source: "manual",
  },
]

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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/app/transacoes",
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("TransacoesLoading", () => {
  it("renderiza skeleton loading", () => {
    const { container } = render(<TransacoesLoading />)
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThanOrEqual(5)
  })
})

describe("TransacoesClient", () => {
  it("renderiza lista de transações com dados", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    expect(screen.getAllByText("Supermercado").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Salário").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Uber").length).toBeGreaterThanOrEqual(1)
  })

  it("mostra categorias corretas na lista", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    expect(screen.getByText(/Alimentação/)).toBeInTheDocument()
    expect(screen.getByText(/Transporte/)).toBeInTheDocument()
  })

  it("busca por texto altera o estado do filtro", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    const searchInput = screen.getByPlaceholderText("Buscar transações...")
    fireEvent.change(searchInput, { target: { value: "Super" } })
    expect((searchInput as HTMLInputElement).value).toBe("Super")
  })
})