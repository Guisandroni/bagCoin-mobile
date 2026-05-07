import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useReports, useDeleteReport } from "@/hooks/use-reports"
import type { ReactNode } from "react"

const mockReports = vi.hoisted(() => ({
  items: [
    { id: 1, user_uuid: null, period_start: "2026-04-01T00:00:00Z", period_end: "2026-04-30T00:00:00Z", file_url: "https://example.com/report.pdf", created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z" },
    { id: 2, user_uuid: null, period_start: "2026-03-01T00:00:00Z", period_end: "2026-03-31T00:00:00Z", file_url: null, created_at: "2026-04-01T00:00:00Z", updated_at: "2026-04-01T00:00:00Z" },
  ],
  total: 2,
}))

vi.mock("@/lib/api-client", () => ({
  default: {},
  api: {
    get: vi.fn().mockResolvedValue(mockReports),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  },
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

describe("useReports", () => {
  it("retorna lista de relatorios", async () => {
    const { result } = renderHook(() => useReports(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(2)
    expect(result.current.data?.total).toBe(2)
    expect(result.current.data?.items[0].file_url).toBeTruthy()
    expect(result.current.data?.items[1].file_url).toBeNull()
  })
})

describe("useDeleteReport", () => {
  it("exclui um relatorio", async () => {
    const { result } = renderHook(() => useDeleteReport(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isIdle).toBe(true))
    await expect(result.current.mutateAsync(1)).resolves.toBeUndefined()
  })
})
