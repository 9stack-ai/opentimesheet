import { defineConfig } from "@playwright/test";

// E2E for the core money flow. Requires a running app with a migrated + seeded DB.
// One-time:  pnpm exec playwright install chromium
// Run:       pnpm db:migrate && pnpm db:seed && pnpm e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev -p 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
