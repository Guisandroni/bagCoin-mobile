import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

function formatCurrencyLocal(v: number) {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  return (v < 0 ? "-R$ " : "R$ ") + formatted
}

describe("formatCurrency", () => {
  it("formats positive values", () => {
    expect(formatCurrencyLocal(8500)).toBe("R$ 8.500,00")
  })

  it("formats negative values", () => {
    expect(formatCurrencyLocal(-287.5)).toBe("-R$ 287,50")
  })

  it("formats zero", () => {
    expect(formatCurrencyLocal(0)).toBe("R$ 0,00")
  })

  it("formats large values", () => {
    expect(formatCurrencyLocal(1234567.89)).toBe("R$ 1.234.567,89")
  })
})

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })
})