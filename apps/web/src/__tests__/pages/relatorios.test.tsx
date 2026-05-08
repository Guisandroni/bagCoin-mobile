import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RelatoriosClient } from "@/app/app/relatorios/relatorios-client"
import RelatoriosLoading from "@/app/app/relatorios/loading"
import type { ReleaseReport } from "@/components/release/types"
import type { ReactNode } from "react"

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

const mockReports: ReleaseReport[] = [
  {
    id: "1",
    name: "Relatório 2026-04",
    period: "2026-04",
    date: "01/05/2026",
    status: "concluido",
    type: "mensal",
  },
  {
    id: "2",
    name: "Relatório 2026-03",
    period: "2026-03",
    date: "01/04/2026",
    status: "pendente",
    type: "mensal",
  },
]

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/relatorios",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  getTokenStore: () => ({ getAccessToken: () => null }),
  setAuthCookies: () => {},
  clearAuthCookies: () => {},
}))

describe("RelatoriosLoading", () => {
  it("renderiza skeleton loading", () => {
    const { container } = render(<RelatoriosLoading />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })
})

describe("RelatoriosClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza lista de relatórios com dados", () => {
    render(<RelatoriosClient reports={mockReports} />, { wrapper: createWrapper() })
    expect(screen.getByText("Relatório 2026-04")).toBeInTheDocument()
    expect(screen.getByText("Relatório 2026-03")).toBeInTheDocument()
  })

  it("exibe status correto dos relatórios", () => {
    render(<RelatoriosClient reports={mockReports} />, { wrapper: createWrapper() })
    expect(screen.getByText("Concluído")).toBeInTheDocument()
    expect(screen.getByText("Pendente")).toBeInTheDocument()
  })

  it("renderiza empty state quando não há relatórios", () => {
    render(<RelatoriosClient reports={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText("Relatórios Financeiros")).toBeInTheDocument()
  })
})