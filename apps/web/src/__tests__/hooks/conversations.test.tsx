import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useConversations, useConversation, useCreateConversation } from "@/hooks/use-conversations"
import type { ReactNode } from "react"

const mockConversations = vi.hoisted(() => ({
  items: [
    { id: "conv-1", title: "Gastei 50 no mercado", user_id: "user-1", is_archived: false, created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z" },
    { id: "conv-2", title: "Quanto gastei esse mês?", user_id: "user-1", is_archived: false, created_at: "2026-04-30T00:00:00Z", updated_at: "2026-04-30T00:00:00Z" },
  ],
  total: 2,
}))

const mockConversationDetail = vi.hoisted(() => ({
  ...mockConversations.items[0],
  messages: [
    { id: "msg-1", conversation_id: "conv-1", role: "user", content: "Gastei 50 no mercado", created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z" },
    { id: "msg-2", conversation_id: "conv-1", role: "assistant", content: "Registrei uma despesa de R$ 50 em Alimentação.", created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z" },
  ],
}))

vi.mock("@/lib/api-client", () => ({
  default: {},
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes("conv-1")) return Promise.resolve(mockConversationDetail)
      return Promise.resolve(mockConversations)
    }),
    post: vi.fn().mockResolvedValue({ ...mockConversations.items[0], id: "conv-new" }),
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

describe("useConversations", () => {
  it("retorna lista de conversas", async () => {
    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(2)
    expect(result.current.data?.total).toBe(2)
    expect(result.current.data?.items[0].title).toBe("Gastei 50 no mercado")
  })
})

describe("useConversation", () => {
  it("retorna detalhes de uma conversa com mensagens", async () => {
    const { result } = renderHook(() => useConversation("conv-1"), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.title).toBe("Gastei 50 no mercado")
    expect(result.current.data?.messages).toHaveLength(2)
    expect(result.current.data?.messages[0].role).toBe("user")
    expect(result.current.data?.messages[1].role).toBe("assistant")
  })

  it("nao faz fetch quando id e null", async () => {
    const { result } = renderHook(() => useConversation(null), { wrapper: createWrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateConversation", () => {
  it("cria uma nova conversa", async () => {
    const { result } = renderHook(() => useCreateConversation(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isIdle).toBe(true))
    const res = await result.current.mutateAsync()
    expect(res.id).toBeDefined()
  })
})
