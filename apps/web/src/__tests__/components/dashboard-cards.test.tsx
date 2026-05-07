import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { StatCards } from "@/components/dashboard/stat-cards"
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"

// Shared mock data
const mockSummaryData = {
  balance: 3220.5,
  total_income: 8500,
  total_expenses: 5280,
  transaction_count: 12,
  categories: [
    { name: "Alimentação", amount: 1150, color: "#FF6B6B" },
    { name: "Transporte", amount: 380, color: "#4ECDC4" },
  ],
  recent_transactions: [
    {
      id: "1",
      name: "Supermercado Pão de Açúcar",
      category: "Alimentação",
      amount: -287.5,
      date: "30 Abr",
      source: "manual",
      status: "confirmed",
    },
    {
      id: "2",
      name: "Salário — Empresa X",
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
  ],
}

const mockUseTransactionSummary = vi.hoisted(() => vi.fn())

vi.mock("@/hooks/use-transactions", () => ({
  useTransactionSummary: () => mockUseTransactionSummary(),
}))

vi.mock("@/lib/store", () => ({
  useAppStore: (selector?: Function) => {
    const state = {
      openModal: vi.fn(),
      closeModal: vi.fn(),
      activeModal: null,
      selectedTransaction: null,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}))

describe("BalanceCard", () => {
  it("renderiza loading skeleton quando isLoading", () => {
    mockUseTransactionSummary.mockReturnValue({ data: undefined, isLoading: true })
    render(<BalanceCard />)
    expect(screen.getByText("Saldo atual")).toBeInTheDocument()
    // Should render "Carregando..." badge when there's no data
    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("renderiza saldo formatado quando dados carregados", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    render(<BalanceCard />)
    expect(screen.getByText("Saldo atual")).toBeInTheDocument()
    // Balance is 3220.5, should show R$ 3.220,50
    expect(screen.getByText(/R\$/)).toBeInTheDocument()
    expect(screen.getByText(/3\.220/)).toBeInTheDocument()
    expect(screen.getByText(/50/)).toBeInTheDocument()
  })

  it("renderiza badge com contagem de transacoes", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    render(<BalanceCard />)
    expect(screen.getByText(/12 transações/)).toBeInTheDocument()
  })

  it("exibe valor negativo com sinal de menos", () => {
    mockUseTransactionSummary.mockReturnValue({
      data: { ...mockSummaryData, balance: -1500 },
      isLoading: false,
    })
    render(<BalanceCard />)
    // Should show "-R$" for negative balance
    const container = document.querySelector(".relative.overflow-hidden")
    expect(container?.textContent).toMatch(/-/)
  })
})

describe("StatCards", () => {
  it("renderiza 3 cards no estado de loading", () => {
    mockUseTransactionSummary.mockReturnValue({ data: undefined, isLoading: true })
    render(<StatCards />)
    expect(screen.getByText("Receitas")).toBeInTheDocument()
    expect(screen.getByText("Despesas")).toBeInTheDocument()
    expect(screen.getByText("Economia")).toBeInTheDocument()
    // Shows "..." while loading
    const loadingIndicators = screen.getAllByText("...")
    expect(loadingIndicators.length).toBeGreaterThanOrEqual(3)
  })

  it("renderiza valores formatados quando dados carregados", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    render(<StatCards />)
    expect(screen.getByText("Receitas")).toBeInTheDocument()
    expect(screen.getByText("Despesas")).toBeInTheDocument()
    expect(screen.getByText("Economia")).toBeInTheDocument()
  })

  it("exibe receitas, despesas e economia corretamente", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    const { container } = render(<StatCards />)
    // Income: R$ 8.500,00
    expect(container.textContent).toMatch(/R\$/)
    expect(container.textContent).toMatch(/8\.500/)
    // Expenses: R$ 5.280,00
    expect(container.textContent).toMatch(/5\.280/)
    // Savings = 8500 - 5280 = 3220
    expect(container.textContent).toMatch(/3\.220/)
  })

  it("exibe subtexto com contagem e percentual", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    const { container } = render(<StatCards />)
    expect(container.textContent).toMatch(/12 transações/)
    expect(container.textContent).toMatch(/2 categorias/)
    // savingsPct = Math.round((3220/8500)*100) = 38%
    expect(container.textContent).toMatch(/38%/)
  })
})

describe("CategoryBreakdown", () => {
  it("renderiza estado de loading", () => {
    mockUseTransactionSummary.mockReturnValue({ data: undefined, isLoading: true })
    render(<CategoryBreakdown />)
    expect(screen.getByText("Gastos por categoria")).toBeInTheDocument()
    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("renderiza mensagem quando nao ha categorias", () => {
    mockUseTransactionSummary.mockReturnValue({
      data: { ...mockSummaryData, categories: [] },
      isLoading: false,
    })
    render(<CategoryBreakdown />)
    expect(screen.getByText("Nenhum gasto registrado")).toBeInTheDocument()
  })

  it("renderiza categorias com donut chart quando ha dados", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    const { container } = render(<CategoryBreakdown />)
    expect(screen.getByText("Gastos por categoria")).toBeInTheDocument()
    expect(screen.getByText("Alimentação")).toBeInTheDocument()
    expect(screen.getByText("Transporte")).toBeInTheDocument()
  })

  it("exibe percentuais corretos para cada categoria", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    const { container } = render(<CategoryBreakdown />)
    // Alimentação: 1150 / (1150+380) = 1150/1530 = 75%
    expect(container.textContent).toMatch(/75%/)
    // Transporte: 380 / 1530 = 25%
    expect(container.textContent).toMatch(/25%/)
  })
})

describe("RecentTransactions", () => {
  it("renderiza estado de loading", () => {
    mockUseTransactionSummary.mockReturnValue({ data: undefined, isLoading: true })
    render(<RecentTransactions />)
    expect(screen.getByText("Últimas transações")).toBeInTheDocument()
    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("renderiza lista de transacoes quando dados carregados", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    render(<RecentTransactions />)
    expect(screen.getByText("Últimas transações")).toBeInTheDocument()
    expect(screen.getByText("Supermercado Pão de Açúcar")).toBeInTheDocument()
    expect(screen.getByText("Salário — Empresa X")).toBeInTheDocument()
    expect(screen.getByText("Uber")).toBeInTheDocument()
  })

  it("exibe pending badge para transacoes pendentes", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    render(<RecentTransactions />)
    // Uber is pending, should show "pendente" badge
    const pendingBadges = screen.getAllByText("pendente")
    expect(pendingBadges.length).toBeGreaterThanOrEqual(1)
  })

  it("exibe link Ver todas", () => {
    mockUseTransactionSummary.mockReturnValue({ data: mockSummaryData, isLoading: false })
    render(<RecentTransactions />)
    expect(screen.getByText("Ver todas")).toBeInTheDocument()
  })

  it("exibe mensagem quando nao ha transacoes", () => {
    mockUseTransactionSummary.mockReturnValue({
      data: { ...mockSummaryData, recent_transactions: [] },
      isLoading: false,
    })
    render(<RecentTransactions />)
    expect(screen.getByText("Nenhuma transação ainda")).toBeInTheDocument()
  })
})
