import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useCreditCards } from "@/hooks/use-credit-cards"
import type { ReactNode } from "react"

const mockCards = vi.hoisted(() => [
  { id: 1, name: "Nubank", limit: 5000, closing_day: 3, due_day: 10, issuer: "Mastercard", color: "#7c3aed", created_at: "2026-04-01T00:00:00Z" },
  { id: 2, name: "Inter", limit: 8000, closing_day: 15, due_day: 22, issuer: "Visa", color: "#ff6b35", created_at: "2026-04-01T00:00:00Z" },
])

vi.mock("@/lib/api-client", () => ({
  default: {},
  api: {
    get: vi.fn().mockResolvedValue(mockCards),
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

describe("useCreditCards", () => {
  it("retorna lista de cartoes", async () => {
    const { result } = renderHook(() => useCreditCards(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].name).toBe("Nubank")
    expect(result.current.data![0].limit).toBe(5000)
    expect(result.current.data![0].issuer).toBe("Mastercard")
    expect(result.current.data![1].issuer).toBe("Visa")
  })
})
