import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

test.describe("Dashboard (Authenticated)", () => {
  test.use({ storageState: AUTH_FILE })

  test.beforeEach(async ({ page }) => {
    // Mock the summary endpoint
    await page.route("**/api/v1/bagcoin/transactions/summary", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          balance: 12580.75,
          total_income: 18500,
          total_expenses: 5919.25,
          transaction_count: 42,
          categories: [
            { name: "Alimentação", amount: 1800, color: "#ff6b35" },
            { name: "Moradia", amount: 2200, color: "#7c3aed" },
            { name: "Transporte", amount: 890, color: "#0052ff" },
            { name: "Lazer", amount: 520, color: "#ffab00" },
            { name: "Saúde", amount: 300, color: "#00c853" },
            { name: "Compras", amount: 209.25, color: "#e91e63" },
          ],
          recent_transactions: [
            { id: "1", name: "Supermercado Extra", category: "Alimentação", amount: -387.9, date: "15/04/2026", source: "manual", status: "confirmed" },
            { id: "2", name: "Salário", category: "Salário", amount: 8500, date: "05/04/2026", source: "auto", status: "confirmed" },
            { id: "3", name: "Uber", category: "Transporte", amount: -24.9, date: "14/04/2026", source: "whatsapp", status: "pending" },
          ],
        }),
      })
    })

    await page.route("**/api/v1/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "teste@bagcoin.com.br",
          full_name: "Usuário Teste",
          is_active: true,
          role: "user",
        }),
      })
    })

    await page.goto("/app")
    await page.waitForURL("/app", { timeout: 15000 })
  })

  test("shows balance card with formatted currency", async ({ page }) => {
    await expect(page.locator("text=Saldo atual").first()).toBeVisible({ timeout: 10000 })
    // R$ 12.580,75 — check the formatted balance
    await expect(page.locator("text=R$").first()).toBeVisible()
  })

  test("shows stat cards (Receitas, Despesas, Economia)", async ({ page }) => {
    await expect(page.locator("text=Receitas em Abr").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Despesas em Abr").first()).toBeVisible()
    await expect(page.locator("text=Economia estimada").first()).toBeVisible()
  })

  test("shows pending transactions alert when there are pending items", async ({ page }) => {
    // The mock data includes pending transactions
    const pendingAlert = page.locator("text=Pendências do WhatsApp")
    await expect(pendingAlert).toBeVisible({ timeout: 10000 })
  })

  test("shows category breakdown section", async ({ page }) => {
    await expect(page.locator("text=Gastos por categoria").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows recent transactions list", async ({ page }) => {
    await expect(page.locator("text=Últimas transações").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Supermercado Extra").first()).toBeVisible()
  })

  test("ver todas link navigates to transactions page", async ({ page }) => {
    const verTodas = page.locator("text=Ver todas")
    await expect(verTodas.first()).toBeVisible({ timeout: 10000 })
    await verTodas.first().click()
    await page.waitForURL("/app/transacoes", { timeout: 10000 })
  })

  test("shows no pending alert when no pending transactions", async ({ page }) => {
    // Override to return only confirmed transactions
    await page.route("**/api/v1/bagcoin/transactions/summary", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          balance: 12580.75,
          total_income: 18500,
          total_expenses: 5919.25,
          transaction_count: 40,
          categories: [],
          recent_transactions: [
            { id: "1", name: "Supermercado", category: "Alimentação", amount: -387.9, date: "15/04/2026", source: "manual", status: "confirmed" },
          ],
        }),
      })
    })
    await page.reload()
    await expect(page.locator("text=Pendências do WhatsApp")).not.toBeVisible({ timeout: 5000 })
  })
})
