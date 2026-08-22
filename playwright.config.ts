import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  // All projects share one dev server and one SQLite database (seed proposal
  // 1) — there's no per-worker data isolation yet (that lands with the
  // multi-proposal schema in Fase 12). Parallel workers editing the same
  // field on the same proposal race and can read back each other's writes,
  // so tests must run one at a time until then.
  workers: 1,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: { command: "npm run dev -- --hostname localhost --port 3000", url: "http://localhost:3000/proposals/1/editor", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
});
