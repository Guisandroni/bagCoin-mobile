import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

const MOCK_BUDGETS = {
  items: [
    { id: 1, name: "Alimentação", period: "monthly", total_limit: 2000, total_spent: 1800, total_remaining: 200, percentage: 90, budget_type: "general", category_id: null, category_name: null, created_at: "2026-01-01T00:00:00Z", updated_at: null },
    { id: 2, name: "Transporte", period: "monthly", total_limit: 1000, total_spent: 890, total_remaining: 110, percentage: 89, budget_type: "general", category_id: null, category_name: null, created_at: "2026-01-01T00:00:00Z", updated_at: null },
    { id: 3, name: "Lazer", period: "weekly", total_limit: 600, total_spent: 750, total_remaining: -150, percentage: 125, budget_type: "general", category_id: null, category_name: null, created_at: "2026-01-01T00:00:00Z", updated_at: null },
  ],
  total: 3,
}

test.describe("Budgets Page (Authenticated)", () => {
  test.use({ storageState: AUTH_FILE })

  test.beforeEach(async ({ page }) => {
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

    await page.route("**/api/v1/bagcoin/budgets/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_BUDGETS),
      })
    })

    await page.route("**/api/v1/bagcoin/transactions/summary", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          balance: 12580.75,
          total_income: 18500,
          total_expenses: 5919.25,
          transaction_count: 42,
          categories: [],
          recent_transactions: [],
        }),
      })
    })

    await page.goto("/app/orcamentos")
    await page.waitForURL("/app/orcamentos", { timeout: 15000 })
  })

  test("shows page title", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Orçamentos" })).toBeVisible({ timeout: 10000 })
  })

  test("shows budget cards with names", async ({ page }) => {
    await expect(page.locator("text=Alimentação").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Transporte").first()).toBeVisible()
    await expect(page.locator("text=Lazer").first()).toBeVisible()
  })

  test("shows period badge on each card", async ({ page }) => {
    await expect(page.locator("text=Mensal").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows progress bars", async ({ page }) => {
    // Seed budgets: Alimentação ~67.4%, Transporte ~39.6%
    await expect(page.locator("text=67.4% utilizado").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=39.6% utilizado").first()).toBeVisible()
  })

  test("shows spent and limit amounts", async ({ page }) => {
    await expect(page.locator("text=R$ 404,10").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=R$ 600,00").first()).toBeVisible()
  })

  test("shows remaining amount", async ({ page }) => {
    await expect(page.locator("text=Restante:").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows 'Novo Orçamento' button", async ({ page }) => {
    const btn = page.getByRole("button", { name: /novo orçamento/i })
    await expect(btn).toBeVisible({ timeout: 10000 })
  })

  test("shows edit and delete buttons on each card", async ({ page }) => {
    const editButtons = page.locator('button:has(svg.lucide-pencil)')
    const deleteButtons = page.locator('button:has(svg.lucide-trash2)')
    // At least one edit and one delete button
    await expect(editButtons.first()).toBeVisible({ timeout: 10000 })
    await expect(deleteButtons.first()).toBeVisible()
  })
})
