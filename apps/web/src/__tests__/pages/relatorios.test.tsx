import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import RelatoriosPage from "@/app/app/relatorios/page"
import type { ReactNode } from "react"

// ── Mock data ──────────────────────────────────────────

const mockReports = {
  items: [
    { id: 1, user_uuid: null, period_start: "2026-04-01T00:00:00Z", period_end: "2026-04-30T00:00:00Z", file_url: "https://example.com/report-april.pdf", created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z" },
    { id: 2, user_uuid: null, period_start: "2026-03-01T00:00:00Z", period_end: "2026-03-31T00:00:00Z", file_url: null, created_at: "2026-04-01T00:00:00Z", updated_at: "2026-04-01T00:00:00Z" },
  ],
  total: 2,
}

// ── Mocks ──────────────────────────────────────────────

const mockUseReports = vi.hoisted(() => vi.fn())

vi.mock("@/hooks/use-reports", () => ({
  useReports: mockUseReports,
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
  setAuthCookies: () => { },
  clearAuthCookies: () => { },
}))

// ── Wrapper ────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ── Tests ──────────────────────────────────────────────

describe("RelatoriosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza skeleton loading quando isLoading é true", () => {
    mockUseReports.mockReturnValue({ data: undefined, isLoading: true, error: null })

    const { container } = render(<RelatoriosPage />, { wrapper: createWrapper() })
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renderiza empty state quando não há relatórios", () => {
    mockUseReports.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhum relatório gerado")).toBeInTheDocument()
    expect(screen.getByText(/Use o formulário acima/)).toBeInTheDocument()
  })

  it("renderiza error state quando há erro", () => {
    mockUseReports.mockReturnValue({ data: undefined, isLoading: false, error: new Error("Erro ao buscar") })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    expect(screen.getByText("Erro ao carregar relatórios")).toBeInTheDocument()
    expect(screen.getByText("Erro ao buscar")).toBeInTheDocument()
  })

  it("renderiza lista de relatórios com dados", () => {
    mockUseReports.mockReturnValue({ data: mockReports, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    // Each report card has a title "Relatório Financeiro"
    const reportTitles = screen.getAllByText("Relatório Financeiro")
    expect(reportTitles).toHaveLength(2)
  })

  it("exibe botão de download quando relatório tem file_url", () => {
    mockUseReports.mockReturnValue({ data: mockReports, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    const downloadButtons = screen.getAllByText("Download PDF")
    expect(downloadButtons).toHaveLength(1)
  })

  it("mostra mensagem de processamento quando relatório não tem file_url", () => {
    mockUseReports.mockReturnValue({ data: mockReports, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/Relatório em processamento/)).toBeInTheDocument()
  })

  it("exibe período do relatório no badge", () => {
    mockUseReports.mockReturnValue({ data: mockReports, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    // The period is rendered inside a badge as "DD/MM/YYYY — DD/MM/YYYY"
    // Due to text breaking across elements, use a custom matcher
    const badges = screen.getAllByText((content) => {
      return content.includes("04") && content.includes("2026")
    })
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it("exibe data de geração do relatório (texto Gerado em)", () => {
    mockUseReports.mockReturnValue({ data: mockReports, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    // "Gerado em" appears once per report card
    const geradoTexts = screen.getAllByText(/Gerado em/)
    expect(geradoTexts).toHaveLength(2)
  })

  it("abre URL do relatório ao clicar em download", async () => {
    // Mock fetch to avoid actual network call
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("no fetch in tests"))
    // Store original window.open
    const originalOpen = window.open
    const mockOpen = vi.fn()
    window.open = mockOpen

    mockUseReports.mockReturnValue({ data: mockReports, isLoading: false, error: null })

    render(<RelatoriosPage />, { wrapper: createWrapper() })
    const downloadButton = screen.getByText("Download PDF")
    fireEvent.click(downloadButton)

    // fetch fails → fallback to window.open
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalled()
    })

    // Restore original
    window.open = originalOpen
    globalThis.fetch = originalFetch
  })
})
