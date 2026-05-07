import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import TransacoesClient from "@/app/app/transacoes/transacoes-client"
import TransacoesLoading from "@/app/app/transacoes/loading"
import { useAppStore } from "@/lib/store"
import type { ReactNode } from "react"
import type { Transaction } from "@/types"

const mockItems: Transaction[] = [
  {
    id: "1",
    name: "Supermercado",
    category: "Alimentação",
    amount: -287.5,
    date: "30 Abr",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "2",
    name: "Salário",
    category: "Salário",
    amount: 8500,
    date: "28 Abr",
    source: "auto",
    status: "confirmed",
  },
  {
    id: "3",
    name: "Uber",
    category: "Transporte",
    amount: -35,
    date: "29 Abr",
    source: "manual",
    status: "pending",
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
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.getState().resetFilter()
    useAppStore.setState({
      activeModal: null,
      selectedTransaction: null,
      filter: {
        ...useAppStore.getState().filter,
        searchQuery: "",
        type: "all",
      },
    })
  })

  it("renderiza empty state quando não há transações", () => {
    render(<TransacoesClient transactions={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhuma transação encontrada")).toBeInTheDocument()
    expect(screen.getByText("Nova transação")).toBeInTheDocument()
  })

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

  it("filtra por 'Confirmadas' quando clica no botão", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByRole("button", { name: /filtrar por status/i }))
    fireEvent.click(screen.getByRole("button", { name: /^Confirmadas$/ }))
    expect(screen.getAllByText("Supermercado").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Salário").length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("Uber")).not.toBeInTheDocument()
  })

  it("filtra por 'Pendentes' quando clica no botão", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByRole("button", { name: /filtrar por status/i }))
    fireEvent.click(screen.getByRole("button", { name: /^Pendentes$/ }))
    expect(screen.getAllByText("Uber").length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("Supermercado")).not.toBeInTheDocument()
    expect(screen.queryByText("Salário")).not.toBeInTheDocument()
  })

  it("busca por texto altera o estado do filtro", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    const searchInput = screen.getByPlaceholderText("Buscar transações...")
    fireEvent.change(searchInput, { target: { value: "Super" } })
    expect((searchInput as HTMLInputElement).value).toBe("Super")
  })

  it("abre modal de filtro ao clicar no botão de filtro", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    const buttons = screen.getAllByRole("button")
    const filterBtn = buttons.find((b) => b.querySelector("svg.lucide-sliders-horizontal"))
    expect(filterBtn).toBeTruthy()
    fireEvent.click(filterBtn!)
    expect(useAppStore.getState().activeModal).toBe("filter")
  })

  it("mostra badge 'pendente' para transações pendentes", () => {
    render(<TransacoesClient transactions={mockItems} />, { wrapper: createWrapper() })
    const pendingBadges = screen.getAllByText("pendente")
    expect(pendingBadges.length).toBeGreaterThanOrEqual(1)
  })

  it("abre modal de nova transação ao clicar no botão do empty state", () => {
    render(<TransacoesClient transactions={[]} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Nova transação"))
    expect(useAppStore.getState().activeModal).toBe("new-transaction")
  })
})
