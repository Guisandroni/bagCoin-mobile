import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

test.describe("Debug Transactions", () => {
  test.use({ storageState: AUTH_FILE })

  test("debug page content", async ({ page }) => {
    const requests: string[] = []
    page.on("request", (req) => {
      requests.push(`${req.method()} ${req.url()}`)
    })

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

    // Mock summary ONLY with explicit route
    await page.route("**/bagcoin/transactions/summary", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          balance: 12580.75,
          total_income: 18500,
          total_expenses: 5919.25,
          transaction_count: 6,
          categories: [],
          recent_transactions: [],
        }),
      })
    })

    // Mock transactions list with explicit route
    await page.route("**/bagcoin/transactions", (route) => {
      const url = route.request().url()
      if (url.includes("summary")) {
        route.fallback()
        return
      }
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { id: "1", name: "Supermercado Extra", category: "Alimentação", amount: -387.9, date: "15/04/2026", source: "manual", status: "confirmed" },
            { id: "2", name: "Salário", category: "Salário", amount: 8500, date: "05/04/2026", source: "auto", status: "confirmed" },
            { id: "3", name: "Uber", category: "Transporte", amount: -24.9, date: "14/04/2026", source: "whatsapp", status: "pending" },
          ],
          total: 3,
        }),
      })
    })

    await page.goto("/app/transacoes", { timeout: 15000 })
    await page.waitForLoadState("networkidle")

    // Log all requests
    for (const r of requests) {
      console.log(`REQ: ${r}`)
    }

    // Check body text
    const text = await page.evaluate(() => document.body.innerText)
    console.log(`BODY TEXT: ${text.substring(0, 3000)}`)
  })
})
