import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ContasClient } from "@/app/app/contas/contas-client"
import type { ReactNode } from "react"

// ── Mock data ──────────────────────────────────────────

const mockAccounts = [
  { id: 1, name: "NuBank", type: "CHECKING", balance: 5200, bank: "NuBank", color: "#7c3aed", created_at: "2026-04-01T00:00:00Z" },
  { id: 2, name: "Poupança", type: "SAVINGS", balance: 12000, bank: "Bradesco", color: "#0052ff", created_at: "2026-04-01T00:00:00Z" },
]

const mockCreditCards = [
  { id: 1, name: "Nubank", limit: 5000, closing_day: 3, due_day: 10, issuer: "Mastercard", color: "#7c3aed", created_at: "2026-04-01T00:00:00Z" },
  { id: 2, name: "Inter", limit: 8000, closing_day: 15, due_day: 22, issuer: "Visa", color: "#ff6b35", created_at: "2026-04-01T00:00:00Z" },
]

// ── Mocks ──────────────────────────────────────────────

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    filter: { type: "all", categories: [], searchQuery: "" },
    openModal: vi.fn(),
    setFilter: vi.fn(),
  }),
}))

vi.mock("@/app/app/contas/actions", () => ({
  revalidateAccounts: vi.fn(),
  revalidateCreditCards: vi.fn(),
}))

const mockUseAccounts = vi.hoisted(() => vi.fn())
const mockUseCreditCards = vi.hoisted(() => vi.fn())
const mockDeleteAccountMutate = vi.fn()
const mockDeleteCreditCardMutate = vi.fn()
const mockCreateAccountMutate = vi.fn()
const mockUpdateAccountMutate = vi.fn()
const mockCreateCardMutate = vi.fn()
const mockUpdateCardMutate = vi.fn()

vi.mock("@/hooks/use-accounts", () => ({
  useAccounts: mockUseAccounts,
  useCreateAccount: () => ({ mutateAsync: mockCreateAccountMutate, isPending: false }),
  useUpdateAccount: () => ({ mutateAsync: mockUpdateAccountMutate, isPending: false }),
  useDeleteAccount: () => ({ mutateAsync: mockDeleteAccountMutate, isPending: false }),
}))

vi.mock("@/hooks/use-credit-cards", () => ({
  useCreditCards: mockUseCreditCards,
  useCreateCreditCard: () => ({ mutateAsync: mockCreateCardMutate, isPending: false }),
  useUpdateCreditCard: () => ({ mutateAsync: mockUpdateCardMutate, isPending: false }),
  useDeleteCreditCard: () => ({ mutateAsync: mockDeleteCreditCardMutate, isPending: false }),
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

// ── Wrapper ────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// ── Tests ──────────────────────────────────────────────

describe("ContasClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza empty state quando não há contas nem cartões", () => {
    mockUseAccounts.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: [], isLoading: false, isError: false })

    render(<ContasClient initialAccounts={[]} initialCards={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText("Nenhuma conta ou cartão")).toBeInTheDocument()
    expect(screen.getByText("Adicionar conta")).toBeInTheDocument()
  })

  it("renderiza contas com saldo", () => {
    mockUseAccounts.mockReturnValue({ data: mockAccounts, isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: mockCreditCards, isLoading: false, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })
    expect(screen.getAllByText("NuBank").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Poupança")).toBeInTheDocument()
    expect(screen.getByText(/Bradesco/)).toBeInTheDocument()
  })

  it("mostra saldo agregado em contas", () => {
    mockUseAccounts.mockReturnValue({ data: mockAccounts, isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: mockCreditCards, isLoading: false, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })
    expect(screen.getByText("Saldo em contas")).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*17\.200/)).toBeInTheDocument()
    expect(screen.getByText("2 conta(s) registrada(s)")).toBeInTheDocument()
  })

  it("renderiza cartões com issuer (bandeira)", () => {
    mockUseAccounts.mockReturnValue({ data: mockAccounts, isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: mockCreditCards, isLoading: false, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })
    expect(screen.getByText("Cartões de crédito")).toBeInTheDocument()
    expect(screen.getByText(/Mastercard/)).toBeInTheDocument()
    expect(screen.getByText(/Visa/)).toBeInTheDocument()
  })

  it("mostra dados de fechamento e vencimento dos cartões", () => {
    mockUseAccounts.mockReturnValue({ data: mockAccounts, isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: mockCreditCards, isLoading: false, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })
    expect(screen.getByText(/Fecha dia 3/)).toBeInTheDocument()
    expect(screen.getByText(/Vence dia 10/)).toBeInTheDocument()
    expect(screen.getByText(/Fecha dia 15/)).toBeInTheDocument()
    expect(screen.getByText(/Vence dia 22/)).toBeInTheDocument()
  })

  it("abre dialog de nova conta ao clicar em Adicionar no empty state", () => {
    mockUseAccounts.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: [], isLoading: false, isError: false })

    render(<ContasClient initialAccounts={[]} initialCards={[]} />, { wrapper: createWrapper() })
    fireEvent.click(screen.getByText("Adicionar conta"))

    expect(screen.getByText("Nova Conta")).toBeInTheDocument()
  })

  it("abre dialog de nova conta ao clicar em Adicionar na seção de contas", () => {
    mockUseAccounts.mockReturnValue({ data: mockAccounts, isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: mockCreditCards, isLoading: false, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })

    const adicionarButtons = screen.getAllByText("Adicionar")
    fireEvent.click(adicionarButtons[0])

    expect(screen.getByText("Nova Conta")).toBeInTheDocument()
  })

  it("abre dialog de novo cartão ao clicar em Adicionar na seção de cartões", () => {
    mockUseAccounts.mockReturnValue({ data: mockAccounts, isLoading: false, isError: false })
    mockUseCreditCards.mockReturnValue({ data: mockCreditCards, isLoading: false, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })

    fireEvent.click(screen.getByLabelText("Adicionar cartão"))

    expect(screen.getByText("Novo Cartão")).toBeInTheDocument()
  })

  it("usa initial data quando React Query está loading", () => {
    mockUseAccounts.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    mockUseCreditCards.mockReturnValue({ data: undefined, isLoading: true, isError: false })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })
    expect(screen.getByText("NuBank")).toBeInTheDocument()
    expect(screen.getByText("Nubank")).toBeInTheDocument()
  })

  it("usa initial data quando React Query está em erro", () => {
    mockUseAccounts.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    mockUseCreditCards.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    render(<ContasClient initialAccounts={mockAccounts} initialCards={mockCreditCards} />, { wrapper: createWrapper() })
    expect(screen.getByText("NuBank")).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*17\.200/)).toBeInTheDocument()
  })
})
