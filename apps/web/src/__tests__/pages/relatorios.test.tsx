import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RelatoriosClient } from "@/app/app/relatorios/relatorios-client"
import RelatoriosLoading from "@/app/app/relatorios/loading"
import type { Report } from "@/hooks/use-reports"
import type { ReactNode } from "react"

const mockReports: Report[] = [
  {
    id: 1,
    user_uuid: null,
    period_start: "2026-04-01T00:00:00Z",
    period_end: "2026-04-30T00:00:00Z",
    file_url: "https://example.com/report-april.pdf",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 2,
    user_uuid: null,
    period_start: "2026-03-01T00:00:00Z",
    period_end: "2026-03-31T00:00:00Z",
    file_url: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
]

vi.mock("@/hooks/use-reports", () => ({
  useCreateReport: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteReport: () => ({ mutate: vi.fn() }),
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

  it("renderiza empty state quando não há relatórios", () => {
    render(<RelatoriosClient initialReports={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhum relatório gerado")).toBeInTheDocument()
    expect(
      screen.getByText(/Toque em Gerar novo relatório ou peça ao assistente/)
    ).toBeInTheDocument()
  })

  it("renderiza lista de relatórios com dados", () => {
    render(<RelatoriosClient initialReports={mockReports} />, { wrapper: createWrapper() })
    const reportTitles = screen.getAllByText("Relatório financeiro")
    expect(reportTitles).toHaveLength(2)
  })

  it("exibe link/indicador PDF quando relatório tem file_url", () => {
    render(<RelatoriosClient initialReports={mockReports} />, { wrapper: createWrapper() })
    expect(screen.getAllByText("PDF").length).toBeGreaterThanOrEqual(1)
  })

  it("mostra mensagem de processamento quando relatório não tem file_url", () => {
    render(<RelatoriosClient initialReports={mockReports} />, { wrapper: createWrapper() })
    expect(screen.getByText("Processando")).toBeInTheDocument()
  })

  it("exibe período do relatório no badge", () => {
    render(<RelatoriosClient initialReports={mockReports} />, { wrapper: createWrapper() })
    const badges = screen.getAllByText((content) => content.includes("04") && content.includes("2026"))
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it("exibe data de geração do relatório (texto Gerado em)", () => {
    render(<RelatoriosClient initialReports={mockReports} />, { wrapper: createWrapper() })
    const geradoTexts = screen.getAllByText(/Gerado em/)
    expect(geradoTexts).toHaveLength(2)
  })

  it("dispara download ao clicar na linha do relatório com PDF", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("no fetch in tests"))
    const originalOpen = window.open
    const mockOpen = vi.fn()
    window.open = mockOpen

    render(<RelatoriosClient initialReports={mockReports} />, { wrapper: createWrapper() })
    const rows = screen.getAllByText("Relatório financeiro")
    const rowEl = rows[0].closest('[role="button"]')
    expect(rowEl).toBeTruthy()
    fireEvent.click(rowEl!)

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalled()
    })

    window.open = originalOpen
    globalThis.fetch = originalFetch
  })
})
