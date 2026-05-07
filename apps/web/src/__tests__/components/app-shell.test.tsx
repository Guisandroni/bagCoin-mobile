import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppShell } from "@/components/layout/app-shell"

vi.mock("@/lib/auth-store", () => ({
  useAuthStore: () => ({
    user: { id: "1", email: "ana@email.com", full_name: "Ana Silva", role: "user" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
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

const mockPathname = vi.hoisted(() => "/app")
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}))

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

vi.mock("@/components/layout/bottom-nav", () => ({
  BottomNav: () => <nav data-testid="bottom-nav">BottomNav</nav>,
}))

describe("AppShell", () => {
  it("renderiza children", () => {
    render(
      <AppShell>
        <p data-testid="child">Conteudo</p>
      </AppShell>
    )
    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.getByText("Conteudo")).toBeInTheDocument()
  })

  it("renderiza Sidebar em desktop", () => {
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(screen.getByTestId("sidebar")).toBeInTheDocument()
  })

  it("envolve children na coluna de conteúdo (max-width)", () => {
    const { container } = render(
      <AppShell>
        <span data-testid="inner">inner content</span>
      </AppShell>
    )
    const column = container.querySelector('[class*="max-w-"]')
    expect(column).toBeTruthy()
    expect(column).toContainElement(screen.getByTestId("inner"))
  })

  it("renderiza BottomNav em mobile (tela 390x844)", () => {
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument()
  })
})
