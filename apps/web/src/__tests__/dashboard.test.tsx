import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/auth-store", () => ({
  useAuthStore: () => ({
    user: { id: "1", email: "ana@email.com", full_name: "Ana Silva", role: "user" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: true }),
  useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import { formatCurrency } from "@/lib/utils"

describe("Dashboard page", () => {
  it("formatCurrency formats positive values correctly", () => {
    expect(formatCurrency(8500)).toBe("R$ 8.500,00")
    expect(formatCurrency(-287.5)).toBe("-R$ 287,50")
  })
})