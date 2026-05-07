import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

const MOCK_BUDGETS = {
  items: [
    { id: 1, name: "Alimentação", period: "monthly", total_limit: 2000, total_spent: 1800, total_remaining: 200, percentage: 90, budget_type: "general", category_id: null, category_name: null, created_at: "2026-01-01T00:00:00Z", updated_at: null },
    { id: 2, name: "Transporte", period: "monthly", total_limit: 1000, total_spent: 890, total_remaining: 110, percentage: 89, budget_type: "general", category_id: null, category_name: null, created_at: "2026-01-01T00:00:00Z", updated_at: null },
  ],
  total: 2,
}

test.describe("Budgets CRUD", () => {
  test.use({ storageState: AUTH_FILE })

  test.beforeEach(async ({ page }) => {
    // Auth mock
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

    await page.route("**/api/v1/bagcoin/budgets/", (route) => {
      const method = route.request().method()
      if (method === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_BUDGETS),
        })
      } else if (method === "POST") {
        const body = route.request().postDataJSON() as {
          name: string
          period: string
          total_limit: number
        }
        const total = Number(body.total_limit)
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 99,
            name: body.name,
            period: body.period,
            total_limit: total,
            total_spent: 0,
            total_remaining: total,
            percentage: 0,
            budget_type: "general",
            category_id: null,
            category_name: null,
            created_at: new Date().toISOString(),
            updated_at: null,
          }),
        })
      } else {
        route.fallback()
      }
    })

    await page.goto("/app/orcamentos")
    await page.waitForURL("/app/orcamentos", { timeout: 15000 })
  })

  test("creates a new budget via dialog form", async ({ page }) => {
    // Click "Novo Orçamento" button
    await page.getByRole("button", { name: /novo orçamento/i }).click()

    // Fill the dialog form
    await page.locator("#name").fill("Novo Orçamento Teste")

    // Select period
    await page.locator("text=Selecione o período").click()
    await page.locator("text=Mensal").click()

    // Fill limit
    await page.locator("#limit").fill("3000")

    // Submit
    await page.getByRole("button", { name: /criar orçamento/i }).click()

    // Wait for dialog to close
    await expect(page.locator("#name")).not.toBeVisible({ timeout: 5000 })
  })

  test("edits a budget via edit button", async ({ page }) => {
    let patchCalled = false
    let patchId: number | null = null

    await page.route("**/api/v1/bagcoin/budgets/*", (route) => {
      if (route.request().method() === "PATCH") {
        patchCalled = true
        const urlParts = route.request().url().split("/")
        patchId = Number(urlParts[urlParts.length - 1])
        const patchBody = route.request().postDataJSON() as { name?: string }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: patchId ?? 1,
            name: patchBody.name ?? "Alimentação Editado",
            period: "monthly",
            total_limit: 2000,
            total_spent: 1800,
            total_remaining: 200,
            percentage: 90,
            budget_type: "general",
            category_id: null,
            category_name: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: new Date().toISOString(),
          }),
        })
        return
      }
      route.fallback()
    })

    // Click edit button on first budget card
    const editButton = page.locator('button:has(svg.lucide-pencil)').first()
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()

    // Dialog should open; verify the edit form title
    await expect(page.locator("text=Editar Orçamento").first()).toBeVisible({ timeout: 5000 })

    // Modify the name
    const nameInput = page.locator("#name")
    await nameInput.clear()
    await nameInput.fill("Alimentação Editado")

    // Submit
    await page.getByRole("button", { name: /salvar alterações/i }).click()

    // Dialog should close
    await expect(page.locator("#name")).not.toBeVisible({ timeout: 5000 })
  })

  test("deletes a budget via delete confirmation dialog", async ({ page }) => {
    let deleteCalled = false
    let deleteId: number | null = null

    await page.route("**/api/v1/bagcoin/budgets/*", (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true
        const urlParts = route.request().url().split("/")
        deleteId = Number(urlParts[urlParts.length - 1])
        route.fulfill({ status: 204 })
        return
      }
      route.fallback()
    })

    // Click delete button on first budget card
    const deleteButton = page.locator('button:has(svg.lucide-trash2)').first()
    await expect(deleteButton).toBeVisible({ timeout: 10000 })
    await deleteButton.click()

    // Confirmation dialog should appear
    await expect(page.locator("text=Excluir Orçamento").first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator("text=Tem certeza que deseja excluir este orçamento?").first()).toBeVisible()

    // Confirm deletion
    await page.getByRole("button", { name: /excluir/i }).last().click()

    // Dialog should close
    await expect(page.locator("text=Excluir Orçamento")).not.toBeVisible({ timeout: 5000 })
  })

  test("cancels budget deletion", async ({ page }) => {
    // Click delete button
    const deleteButton = page.locator('button:has(svg.lucide-trash2)').first()
    await deleteButton.click()

    // Click Cancelar
    await page.getByRole("button", { name: /cancelar/i }).first().click()

    // Dialog should close
    await expect(page.locator("text=Excluir Orçamento")).not.toBeVisible({ timeout: 5000 })
  })
})
