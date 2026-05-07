import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ConfiguracoesPage from "@/app/app/configuracoes/page"

// ── Mocks ──────────────────────────────────────────────

const mockSetTheme = vi.fn()
let mockTheme = "dark"

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}))

// ── Tests ──────────────────────────────────────────────

describe("ConfiguracoesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme = "dark"
  })

  it("renderiza título da página", () => {
    render(<ConfiguracoesPage />)
    expect(screen.getByText("Aparência")).toBeInTheDocument()
  })

  it("renderiza as três opções de aparência", () => {
    render(<ConfiguracoesPage />)
    expect(screen.getByText("Claro")).toBeInTheDocument()
    expect(screen.getByText("Escuro")).toBeInTheDocument()
    expect(screen.getByText("Sistema")).toBeInTheDocument()
  })

  it("botão do tema ativo tem classe bg-primary (default variant)", () => {
    mockTheme = "dark"
    render(<ConfiguracoesPage />)

    const darkButton = screen.getByText("Escuro").closest("button")
    expect(darkButton?.className).toContain("bg-primary")

    const lightButton = screen.getByText("Claro").closest("button")
    expect(lightButton?.className).toContain("bg-secondary")
  })

  it("chama setTheme com 'light' ao clicar em Claro", () => {
    render(<ConfiguracoesPage />)
    fireEvent.click(screen.getByText("Claro"))
    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("chama setTheme com 'dark' ao clicar em Escuro", () => {
    render(<ConfiguracoesPage />)
    fireEvent.click(screen.getByText("Escuro"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("chama setTheme com 'system' ao clicar em Sistema", () => {
    render(<ConfiguracoesPage />)
    fireEvent.click(screen.getByText("Sistema"))
    expect(mockSetTheme).toHaveBeenCalledWith("system")
  })

  it("renderiza seção de Preferências com idioma, notificações e privacidade", () => {
    render(<ConfiguracoesPage />)
    expect(screen.getByText("Preferências")).toBeInTheDocument()
    expect(screen.getByText("Idioma")).toBeInTheDocument()
    expect(screen.getByText("Notificações")).toBeInTheDocument()
    expect(screen.getByText("Privacidade")).toBeInTheDocument()
  })

  it("renderiza descrições das opções de preferências", () => {
    render(<ConfiguracoesPage />)
    expect(screen.getByText("Português (Brasil)")).toBeInTheDocument()
    expect(screen.getByText("Alertas de transações e metas")).toBeInTheDocument()
    expect(screen.getByText("Dados e permissões")).toBeInTheDocument()
  })

  it("renderiza seção do WhatsApp com status de conexão", () => {
    render(<ConfiguracoesPage />)
    expect(screen.getByText("WhatsApp")).toBeInTheDocument()
    expect(screen.getByText("Conexão ativa")).toBeInTheDocument()
    expect(screen.getByText("Todos os lançamentos são detectados automaticamente")).toBeInTheDocument()
  })

  it("destaca tema 'light' com bg-primary quando é o tema atual", () => {
    mockTheme = "light"
    render(<ConfiguracoesPage />)

    const lightButton = screen.getByText("Claro").closest("button")
    expect(lightButton?.className).toContain("bg-primary")

    const darkButton = screen.getByText("Escuro").closest("button")
    expect(darkButton?.className).toContain("bg-secondary")
  })

  it("destaca tema 'system' com bg-primary quando é o tema atual", () => {
    mockTheme = "system"
    render(<ConfiguracoesPage />)

    const systemButton = screen.getByText("Sistema").closest("button")
    expect(systemButton?.className).toContain("bg-primary")

    const lightButton = screen.getByText("Claro").closest("button")
    expect(lightButton?.className).toContain("bg-secondary")
  })
})
