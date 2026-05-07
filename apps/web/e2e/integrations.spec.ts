import { test, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.resolve(__dirname, ".auth", "user.json")

test.describe("Integrações (pareamento web ↔ bot)", () => {
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

    await page.route("**/api/v1/auth/refresh**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-jwt-token-para-testes",
          refresh_token: "fake-refresh-token",
        }),
      })
    })

    await page.route("**/api/v1/integrations/status*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          whatsapp_linked: false,
          telegram_linked: false,
          phone_number: null,
        }),
      })
    })
  })

  test("POST link-token ao Conectar WhatsApp abre wa.me num popup", async ({ page }) => {
    const tok = "abcdefghijklmnopqr"
    const wa = `https://wa.me/5511999999999?text=${encodeURIComponent(`#bagcoin link ${tok}`)}`

    let linkTokenHits = 0
    await page.route("**/api/v1/integrations/link-token", async (route) => {
      if (route.request().method() !== "POST") {
        return route.continue()
      }
      linkTokenHits += 1
      const body = {
        token: tok,
        expires_at: new Date(Date.now() + 600_000).toISOString(),
        deeplink_whatsapp: wa,
        deeplink_telegram: `https://t.me/testbagcoinbot?start=${tok}`,
        manual_command_whatsapp: `#bagcoin link ${tok}`,
        manual_command_telegram: `/start ${tok}`,
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      })
    })

    await page.goto("/app/configuracoes/integracoes", {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    })
    await expect(page).toHaveURL(/\/app\/configuracoes\/integracoes/, { timeout: 60_000 })
    await expect(page.locator("main").getByRole("button", { name: "Conectar WhatsApp" })).toBeVisible({
      timeout: 60_000,
    })

    const respPromise = page.waitForResponse(
      (r) => r.url().includes("/integrations/link-token") && r.request().method() === "POST",
      { timeout: 30_000 }
    )
    const popupPromise = page.waitForEvent("popup", { timeout: 30_000 })
    await page.locator("main").getByRole("button", { name: "Conectar WhatsApp" }).click()
    await respPromise
    const popup = await popupPromise

    expect(popup.url()).toMatch(/wa\.me|api\.whatsapp\.com/i)
    expect(popup.url()).toMatch(/bagcoin|23bagcoin|%23bagcoin/i)
    await popup.close()

    expect(linkTokenHits).toBe(1)
  })
})
