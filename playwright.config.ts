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
  // Logs in once (Fase 12.3) and shares the session across every test via
  // storageState — tests/e2e/auth.spec.ts opts out per-test where it needs
  // to start logged out.
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", storageState: "tests/.auth/session.json" },
  // Readiness check must stay on a route that's public even when logged
  // out — /proposals/1/editor is gated by proxy.ts since Fase 12.3.
  webServer: { command: "npm run dev -- --hostname localhost --port 3000", url: "http://localhost:3000/api/health", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    // Distinct x-forwarded-for per project: both share one dev server, and
    // lib/auth/rateLimit.ts keys by client IP — without this, auth.spec.ts's
    // rate-limit test in one project would lock out the other project's
    // login attempts for the rest of the run.
    { name: "desktop", use: { ...devices["Desktop Chrome"], extraHTTPHeaders: { "x-forwarded-for": "127.0.0.1" } } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium", extraHTTPHeaders: { "x-forwarded-for": "127.0.0.2" } } },
  ],
});
