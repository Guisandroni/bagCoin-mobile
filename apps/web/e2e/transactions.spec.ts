import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

const MOCK_TRANSACTIONS = {
  items: [
    { id: "1", name: "Supermercado Extra", category: "Alimentação", amount: -387.9, date: "15/04/2026", source: "manual", status: "confirmed" },
    { id: "2", name: "Salário", category: "Salário", amount: 8500, date: "05/04/2026", source: "auto", status: "confirmed" },
    { id: "3", name: "Uber", category: "Transporte", amount: -24.9, date: "14/04/2026", source: "whatsapp", status: "pending" },
    { id: "4", name: "Aluguel", category: "Moradia", amount: -2200, date: "10/04/2026", source: "manual", status: "confirmed" },
    { id: "5", name: "Ifood", category: "Alimentação", amount: -52.3, date: "14/04/2026", source: "whatsapp", status: "pending" },
    { id: "6", name: "Academia", category: "Saúde", amount: -120, date: "01/04/2026", source: "auto", status: "confirmed" },
  ],
  total: 6,
}

test.describe("Transactions Page (Authenticated)", () => {
  test.use({ storageState: AUTH_FILE })

  test.beforeEach(async ({ page }) => {
    // Mock transactions list
    await page.route("**/api/v1/bagcoin/transactions", (route) => {
      const url = route.request().url()
      // Only match list endpoint, not summary
      if (url.includes("summary")) {
        route.fallback()
        return
      }
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TRANSACTIONS),
      })
    })

    // Mock summary (needed for initial store data)
    await page.route("**/api/v1/bagcoin/transactions/summary", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          balance: 12580.75,
          total_income: 18500,
          total_expenses: 5919.25,
          transaction_count: 6,
          categories: [],
          recent_transactions: MOCK_TRANSACTIONS.items.slice(0, 5),
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

    await page.goto("/app/transacoes")
    await page.waitForURL("/app/transacoes", { timeout: 15000 })
  })

  test("shows transactions list with items", async ({ page }) => {
    await expect(page.locator("text=Supermercado Extra").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Salário").first()).toBeVisible()
    await expect(page.locator("text=Uber").first()).toBeVisible()
  })

  test("shows filter tabs (Todas, Confirmadas, Pendentes)", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Todas" })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: "Confirmadas" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Pendentes" })).toBeVisible()
  })

  test("clicking 'Pendentes' filters to show only pending transactions", async ({ page }) => {
    await page.getByRole("button", { name: "Pendentes" }).click()

    // Should show Uber and Ifood (pending), but not confirmed ones
    await expect(page.locator("text=Uber").first()).toBeVisible()
    await expect(page.locator("text=Ifood").first()).toBeVisible()

    // Salário and Supermercado are confirmed, should not appear
    const salario = page.locator("text=Salário")
    await expect(salario).not.toBeVisible()
  })

  test("clicking 'Confirmadas' filters to show only confirmed transactions", async ({ page }) => {
    await page.getByRole("button", { name: "Confirmadas" }).click()

    await expect(page.locator("text=Salário").first()).toBeVisible()
    await expect(page.locator("text=Aluguel").first()).toBeVisible()
  })

  test("shows search input", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar transações..."]')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
  })

  test("shows filter button", async ({ page }) => {
    const filterBtn = page.getByRole("button", { name: "" }).first()
    await expect(filterBtn).toBeVisible({ timeout: 10000 })
  })

  test("shows value formatted with currency", async ({ page }) => {
    // Check that amounts show R$ prefix
    await expect(page.locator("text=R$").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows pending badge on pending transactions", async ({ page }) => {
    const pendingBadge = page.locator("text=pendente").first()
    await expect(pendingBadge).toBeVisible({ timeout: 10000 })
  })
})
