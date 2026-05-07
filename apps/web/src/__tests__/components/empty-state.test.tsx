import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { EmptyState } from "@/components/ui/empty-state"

describe("EmptyState", () => {
  it("renderiza titulo e descricao padrao quando nenhuma prop e fornecida", () => {
    render(<EmptyState />)
    expect(screen.getByText("Nenhum item encontrado")).toBeInTheDocument()
    expect(
      screen.getByText("Não há dados para exibir no momento.")
    ).toBeInTheDocument()
  })

  it("renderiza titulo customizado", () => {
    render(<EmptyState title="Nenhuma transação" />)
    expect(screen.getByText("Nenhuma transação")).toBeInTheDocument()
  })

  it("renderiza descricao customizada", () => {
    render(<EmptyState description="Você ainda não possui lançamentos." />)
    expect(
      screen.getByText("Você ainda não possui lançamentos.")
    ).toBeInTheDocument()
  })

  it("renderiza icone FileQuestion", () => {
    const { container } = render(<EmptyState />)
    // FileQuestion from lucide-react renders an SVG
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("nao renderiza action button quando actionLabel nao e fornecido", () => {
    render(<EmptyState />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renderiza action button quando actionLabel e onAction sao fornecidos", () => {
    render(<EmptyState actionLabel="Criar transação" onAction={() => {}} />)
    expect(
      screen.getByRole("button", { name: /criar transação/i })
    ).toBeInTheDocument()
  })

  it("chama onAction quando action button e clicado", () => {
    const onAction = vi.fn()
    render(
      <EmptyState actionLabel="Adicionar" onAction={onAction} />
    )
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("nao renderiza action button quando apenas onAction e fornecido sem actionLabel", () => {
    const onAction = vi.fn()
    render(<EmptyState onAction={onAction} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("combina titulo, descricao e action corretamente", () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="Lista vazia"
        description="Nada aqui ainda."
        actionLabel="Começar"
        onAction={onAction}
      />
    )
    expect(screen.getByText("Lista vazia")).toBeInTheDocument()
    expect(screen.getByText("Nada aqui ainda.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /começar/i })).toBeInTheDocument()
  })
})
