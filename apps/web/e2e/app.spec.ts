import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test("renders hero section with CTA", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 })
  })

  test("renders brand name", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Bagcoin").first()).toBeVisible({ timeout: 10000 })
  })

  test("CTA button links to /app", async ({ page }) => {
    await page.goto("/")
    const cta = page.getByText("ABRIR APP")
    await expect(cta).toBeVisible({ timeout: 10000 })
    await expect(cta).toHaveAttribute("href", "/app")
  })

  test("quote section renders", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=operating system").first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Login Page", () => {
  test("shows login form with email and password", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel("Senha")).toBeVisible({ timeout: 10000 })
  })

  test("shows submit button", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible({ timeout: 10000 })
  })

  test("shows link to register", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("Cadastre-se")).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Register Page", () => {
  test("shows register form", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByLabel("Nome")).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel("Senha")).toBeVisible({ timeout: 10000 })
  })

  test("shows register button", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible({ timeout: 10000 })
  })

  test("shows link to login", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByText("Entrar")).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Dashboard Auth Guard", () => {
  test("redirects /app to /login when not authenticated", async ({ page }) => {
    await page.goto("/app")
    await page.waitForURL(/\/login/, { timeout: 10000 })
  })

  test("redirects /app/transacoes to /login when not authenticated", async ({ page }) => {
    await page.goto("/app/transacoes")
    await page.waitForURL(/\/login/, { timeout: 10000 })
  })
})

test.describe("Responsive", () => {
  test("mobile login form renders", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/login")
    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel("Senha")).toBeVisible({ timeout: 10000 })
  })
})