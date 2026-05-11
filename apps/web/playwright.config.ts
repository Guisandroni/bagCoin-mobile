import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  /** next dev + first-route compile can exceed 30s under parallel load */
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
    },
    {
      name: "mobile",
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 5"],
        storageState: "./e2e/.auth/user.json",
      },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // Force API host so page.route("**/api/v1/...") matches; do not inherit .env.local
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1",
      API_URL: "http://localhost:8000/api/v1",
    },
  },
})
