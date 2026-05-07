import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

const MOCK_REPORTS = {
  items: [
    { id: 1, user_uuid: "550e8400-e29b-41d4-a716-446655440000", period_start: "2026-04-01", period_end: "2026-04-30", file_url: "https://storage.example.com/reports/1.pdf", created_at: "2026-05-01T10:00:00Z", updated_at: "2026-05-01T10:00:00Z" },
    { id: 2, user_uuid: "550e8400-e29b-41d4-a716-446655440000", period_start: "2026-03-01", period_end: "2026-03-31", file_url: null, created_at: "2026-04-02T08:00:00Z", updated_at: "2026-04-02T08:00:00Z" },
  ],
  total: 2,
}

test.describe("Reports Page (Authenticated)", () => {
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

    await page.route("**/api/v1/bagcoin/reports/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REPORTS),
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

    await page.goto("/app/relatorios")
    await page.waitForURL("/app/relatorios", { timeout: 15000 })
  })

  test("shows page title", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Relatórios" })).toBeVisible({ timeout: 10000 })
  })

  test("shows report cards with period info", async ({ page }) => {
    // First report: 01/04/2026 — 30/04/2026
    await expect(page.locator("text=01/04/2026").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=30/04/2026").first()).toBeVisible()
  })

  test("shows 'Relatório Financeiro' text on cards", async ({ page }) => {
    await expect(page.locator("text=Relatório Financeiro").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows generation date", async ({ page }) => {
    await expect(page.locator("text=Gerado em").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows download button for reports with file_url", async ({ page }) => {
    const downloadBtn = page.getByRole("button", { name: /download/i })
    await expect(downloadBtn.first()).toBeVisible({ timeout: 10000 })
  })

  test("shows processing message for reports without file_url", async ({ page }) => {
    await expect(page.locator("text=Relatório em processamento").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows empty state when no reports", async ({ page }) => {
    await page.route("**/api/v1/bagcoin/reports/", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      })
    })
    await page.reload()
    await expect(page.locator("text=Nenhum relatório gerado").first()).toBeVisible({ timeout: 10000 })
  })
})
