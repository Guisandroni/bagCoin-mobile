import { beforeEach, describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { DashboardView } from "@/components/release/dashboard-view"
import type { ReleaseDashboardSummary, ReleaseNavItem } from "@/components/release/types"

const mockToggleDrawer = vi.fn()

vi.mock("@/lib/store", () => ({
  useAppStore: (selector?: (state: { toggleDrawer: typeof mockToggleDrawer }) => unknown) => {
    const state = { toggleDrawer: mockToggleDrawer }
    return selector ? selector(state) : state
  },
}))

const summary: ReleaseDashboardSummary = {
  totalBalance: 9569.3,
  income: 11500,
  expenses: 1930.7,
  recentTransactions: [],
  categoryBreakdown: [
    { name: "Moradia", percentage: 62, color: "text-[var(--rls-primary-container)]" },
  ],
  goals: [
    { name: "Reserva", current: 4200, target: 5000, percentage: 84 },
  ],
  budgets: [
    { name: "Alimentação", spent: 450, total: 1200, remaining: 750, percentage: 38 },
  ],
}

const navItems: ReleaseNavItem[] = [
  { label: "Início", icon: "home", href: "/app", isActive: true },
  { label: "Categorias", icon: "categorias", href: "/app/categorias" },
]

describe("DashboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders updated balance, category and goals/budgets sections", () => {
    render(
      <DashboardView
        summary={summary}
        navItems={navItems}
        onNavigate={() => {}}
      />
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.queryByText("Centro Financeiro")).not.toBeInTheDocument()
    expect(screen.getByText("Saldo Disponível")).toBeInTheDocument()
    expect(screen.getByText("Gastos por Categoria")).toBeInTheDocument()
    expect(screen.getByText("Metas")).toBeInTheDocument()
    expect(screen.getByText("Orçamentos")).toBeInTheDocument()
    expect(screen.getByText("Reserva")).toBeInTheDocument()
    expect(screen.getByText("Alimentação")).toBeInTheDocument()
  })

  it("calls the category navigation action from the Ver mais button", () => {
    const onViewAllCategories = vi.fn()

    render(
      <DashboardView
        summary={summary}
        navItems={navItems}
        onNavigate={() => {}}
        onViewAllCategories={onViewAllCategories}
      />
    )

    fireEvent.click(screen.getByText("Ver mais"))

    expect(onViewAllCategories).toHaveBeenCalledTimes(1)
  })

  it("usa ícone de menu no header para abrir o drawer", () => {
    const { container } = render(
      <DashboardView
        summary={summary}
        navItems={navItems}
        onNavigate={() => {}}
      />
    )

    fireEvent.click(screen.getByLabelText("Abrir menu"))

    expect(mockToggleDrawer).toHaveBeenCalledTimes(1)
    expect(container.querySelector("header")).toHaveClass("border-b")
    expect(screen.getByRole("heading", { name: "Dashboard" })).toHaveClass("text-[22px]")
    expect(screen.getByRole("heading", { name: "Dashboard" })).not.toHaveClass("text-2xl")
  })
})
