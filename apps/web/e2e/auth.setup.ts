import { test as setup, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.join(__dirname, ".auth", "user.json")

const MOCK_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "teste@bagcoin.com.br",
  full_name: "Usuário Teste",
  phone_number: "+5511999999999",
  is_active: true,
  role: "user",
  avatar_url: null,
  auth_provider: "email",
}

const MOCK_BUDGETS = [
  {
    id: "b1",
    name: "Alimentação",
    category: "Alimentação",
    limit_amount: 2000,
    spent_amount: 1200,
    remaining_amount: 800,
    period: "monthly",
    percentage: 60,
    is_over_budget: false,
    alerts_enabled: true,
  },
  {
    id: "b2",
    name: "Transporte",
    category: "Transporte",
    limit_amount: 800,
    spent_amount: 890,
    remaining_amount: -90,
    period: "monthly",
    percentage: 111,
    is_over_budget: true,
    alerts_enabled: true,
  },
]

const MOCK_GOALS = [
  {
    id: "g1",
    name: "Reserva de Emergência",
    target_amount: 15000,
    current_amount: 7800,
    remaining_amount: 7200,
    percentage: 52,
    status: "active",
    deadline: "2026-12-31",
  },
  {
    id: "g2",
    name: "Viagem Japão",
    target_amount: 25000,
    current_amount: 25000,
    remaining_amount: 0,
    percentage: 100,
    status: "completed",
    deadline: "2026-07-15",
  },
]

const MOCK_TRANSACTIONS = [
  {
    id: "t1",
    type: "EXPENSE",
    description: "Supermercado Extra",
    category_name: "Alimentação",
    amount: 387.9,
    transaction_date: "2026-04-15",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "t2",
    type: "INCOME",
    description: "Salário",
    category_name: "Salário",
    amount: 8500,
    transaction_date: "2026-04-05",
    source: "auto",
    status: "confirmed",
  },
  {
    id: "t3",
    type: "EXPENSE",
    description: "Uber",
    category_name: "Transporte",
    amount: 24.9,
    transaction_date: "2026-04-14",
    source: "whatsapp",
    status: "pending",
  },
  {
    id: "t4",
    type: "EXPENSE",
    description: "Aluguel",
    category_name: "Moradia",
    amount: 2200,
    transaction_date: "2026-04-10",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "t5",
    type: "EXPENSE",
    description: "Ifood",
    category_name: "Alimentação",
    amount: 52.3,
    transaction_date: "2026-04-14",
    source: "whatsapp",
    status: "pending",
  },
]

const MOCK_ACCOUNTS = [
  {
    id: "a1",
    name: "Nubank",
    type: "checking",
    balance: 8500,
    currency: "BRL",
    is_active: true,
  },
  {
    id: "a2",
    name: "Poupança",
    type: "savings",
    balance: 15000,
    currency: "BRL",
    is_active: true,
  },
]

const MOCK_CREDIT_CARDS = [
  {
    id: "cc1",
    name: "Nubank",
    limit_amount: 5000,
    used_amount: 1200,
    closing_day: 10,
    due_day: 15,
    is_active: true,
  },
]

const MOCK_REPORTS = [
  {
    id: "r1",
    type: "monthly",
    month: 4,
    year: 2026,
    generated_at: "2026-05-01T10:00:00Z",
    file_url: "/reports/r1.pdf",
  },
  {
    id: "r2",
    type: "category",
    month: 3,
    year: 2026,
    generated_at: "2026-04-01T10:00:00Z",
    file_url: null,
  },
]

setup.describe("Authenticate", () => {
  setup.describe.configure({ timeout: 180_000 })

  setup(
    "setup auth state via cookie injection + API mocks",
    async ({ page }) => {
    // Real cookies on the context so the first /app request (RSC + cookies()) includes them
    await page.context().addCookies([
      {
        name: "access_token",
        value: "fake-jwt-token-para-testes",
        domain: "localhost",
        path: "/",
      },
      {
        name: "refresh_token",
        value: "fake-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ])

    // Mock auth endpoints
    await page.route("**/api/v1/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      })
    })

    await page.route("**/api/v1/auth/refresh", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-jwt-token-para-testes",
          refresh_token: "fake-refresh-token",
        }),
      })
    })

    // Mock transactions summary (dashboard)
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
          recent_transactions: MOCK_TRANSACTIONS,
        }),
      })
    })

    // Mock transactions list
    await page.route("**/api/v1/bagcoin/transactions?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: MOCK_TRANSACTIONS, total: 5 }),
      })
    })

    // Mock budgets list
    await page.route("**/api/v1/bagcoin/budgets?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: MOCK_BUDGETS, total: 2 }),
      })
    })

    // Mock budgets create
    await page.route("**/api/v1/bagcoin/budgets", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(MOCK_BUDGETS[0]),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: MOCK_BUDGETS, total: 2 }),
        })
      }
    })

    // Mock goals list
    await page.route("**/api/v1/bagcoin/goals?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: MOCK_GOALS, total: 2 }),
      })
    })

    // Mock goals create
    await page.route("**/api/v1/bagcoin/goals", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(MOCK_GOALS[0]),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: MOCK_GOALS, total: 2 }),
        })
      }
    })

    // Mock accounts list
    await page.route("**/api/v1/bagcoin/accounts?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: MOCK_ACCOUNTS, total: 2 }),
      })
    })

    // Mock credit cards list
    await page.route("**/api/v1/bagcoin/credit-cards?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: MOCK_CREDIT_CARDS, total: 1 }),
      })
    })

    // Mock reports list
    await page.route("**/api/v1/bagcoin/reports?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: MOCK_REPORTS, total: 2 }),
      })
    })

    // Mock conversations list
    await page.route("**/api/v1/bagcoin/conversations?*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      })
    })

    // Navigate to dashboard to trigger auth check and save storage
    await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 120_000 })
    await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 90_000 })

    // Verify we're logged in (BalanceCard heading)
    await expect(page.getByText("Saldo atual", { exact: false }).first()).toBeVisible({
      timeout: 30000,
    })

    // Save storage state
    await page.context().storageState({ path: AUTH_FILE })
    }
  )
})

export { AUTH_FILE }
