import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { LoginCard } from "@/components/release/login-card"
import { RegisterCard } from "@/components/release/register-card"

describe("release auth password toggle", () => {
  it("alterna visibilidade da senha no login", () => {
    render(<LoginCard />)

    const password = screen.getByLabelText("Senha")
    expect(password).toHaveAttribute("type", "password")

    fireEvent.click(screen.getByLabelText("Mostrar senha"))
    expect(password).toHaveAttribute("type", "text")

    fireEvent.click(screen.getByLabelText("Ocultar senha"))
    expect(password).toHaveAttribute("type", "password")
  })

  it("alterna visibilidade das senhas no registro", () => {
    render(<RegisterCard />)

    const password = screen.getByLabelText("Senha")
    const confirmPassword = screen.getByLabelText("Confirmar Senha")
    expect(password).toHaveAttribute("type", "password")
    expect(confirmPassword).toHaveAttribute("type", "password")

    const toggles = screen.getAllByLabelText("Mostrar senha")
    fireEvent.click(toggles[0])
    fireEvent.click(toggles[1])

    expect(password).toHaveAttribute("type", "text")
    expect(confirmPassword).toHaveAttribute("type", "text")
  })
})
