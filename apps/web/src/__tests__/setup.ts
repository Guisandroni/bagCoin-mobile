import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

/** Tests exercise MSW + API client; keep mock data off in Vitest. */
vi.mock("@/lib/feature-flags", () => ({
  USE_MOCK_DATA: false,
}))
