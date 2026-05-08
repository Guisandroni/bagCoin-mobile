import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

const MOCK_GOALS = {
  items: [
    { id: 1, title: "Viagem para Europa", target_amount: 15000, current_amount: 4500, deadline: "2026-12-01T00:00:00Z", status: "active", created_at: "2026-01-15T00:00:00Z", updated_at: null },
    { id: 2, title: "Fundo de Emergência", target_amount: 30000, current_amount: 30000, deadline: null, status: "completed", created_at: "2026-01-01T00:00:00Z", updated_at: null },
    { id: 3, title: "Curso Online", target_amount: 2500, current_amount: 800, deadline: "2026-06-30T00:00:00Z", status: "active", created_at: "2026-02-01T00:00:00Z", updated_at: null },
    { id: 4, title: "Reserva de Lazer", target_amount: 5000, current_amount: 1000, deadline: null, status: "cancelled", created_at: "2026-03-01T00:00:00Z", updated_at: null },
  ],
  total: 4,
}

test.describe("Goals Page (Authenticated)", () => {
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

    await page.route("**/api/v1/bagcoin/goals/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GOALS),
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

    await page.goto("/app/metas")
    await page.waitForURL("/app/metas", { timeout: 15000 })
  })

  test("shows page title", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Metas" })).toBeVisible({ timeout: 10000 })
  })

  test("shows goal cards with titles", async ({ page }) => {
    await expect(page.locator("text=Viagem para Europa").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Fundo de Emergência").first()).toBeVisible()
    await expect(page.locator("text=Curso Online").first()).toBeVisible()
  })

  test("shows status badges (Ativa, Concluída, Cancelada)", async ({ page }) => {
    await expect(page.locator("text=Ativa").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Concluída").first()).toBeVisible()
    await expect(page.locator("text=Cancelada").first()).toBeVisible()
  })

  test("shows progress percentage", async ({ page }) => {
    // Viagem para Europa: 4500/15000 = 30%
    await expect(page.locator("text=30.0% concluído").first()).toBeVisible({ timeout: 10000 })
    // Fundo de Emergência: 30000/30000 = 100%
    await expect(page.locator("text=100.0% concluído").first()).toBeVisible()
  })

  test("shows progress bars", async ({ page }) => {
    const progressBars = page.locator('[role="progressbar"]')
    await expect(progressBars.first()).toBeVisible({ timeout: 10000 })
  })

  test("shows current and target amounts", async ({ page }) => {
    await expect(page.locator("text=R$ 4.500,00").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=R$ 15.000,00").first()).toBeVisible()
  })

  test("shows remaining amount for active goals", async ({ page }) => {
    await expect(page.locator("text=Faltam:").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows deadline for goals with deadline", async ({ page }) => {
    await expect(page.locator("text=Prazo:").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows 'Nova Meta' button", async ({ page }) => {
    const btn = page.getByRole("button", { name: /nova meta/i })
    await expect(btn).toBeVisible({ timeout: 10000 })
  })

  test("shows edit and delete buttons on each card", async ({ page }) => {
    const editButtons = page.locator('button:has(svg.lucide-pencil)')
    const deleteButtons = page.locator('button:has(svg.lucide-trash2)')
    await expect(editButtons.first()).toBeVisible({ timeout: 10000 })
    await expect(deleteButtons.first()).toBeVisible()
  })
})
