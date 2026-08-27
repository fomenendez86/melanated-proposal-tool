import { defineConfig, devices } from "playwright/test";
import path from "node:path";

const E2E_BASE_URL = "http://localhost:3100";
const E2E_DATABASE_URL = path.resolve("data/e2e-proposals.db");
const E2E_UPLOAD_DIRECTORY = path.resolve("data/e2e-uploads");

// Keep every E2E mutation away from the developer's working database. The
// dedicated web server recreates this file from migrations + seed per run.
process.env.DATABASE_URL = E2E_DATABASE_URL;
process.env.LIBRARY_UPLOAD_DIRECTORY = E2E_UPLOAD_DIRECTORY;
process.env.E2E_BASE_URL = E2E_BASE_URL;
process.env.NEXT_DIST_DIR = ".next-e2e";
process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES = path.resolve("tests/fixtures/google-fonts.cjs");

export default defineConfig({
  testDir: "./tests/e2e",
  // The suite drives `next dev`, not a production build: every server action
  // is followed by an RSC re-render of a 34-page document, and the first hit
  // on a route also pays for its on-demand compile. Both budgets are sized
  // for that, not for how fast the app is in production.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Projects share one disposable SQLite fixture. Serial execution prevents
  // same-proposal writes from racing within a run; the next run starts clean.
  workers: 1,
  // Logs in once (Fase 12.3) and shares the session across every test via
  // storageState — tests/e2e/auth.spec.ts opts out per-test where it needs
  // to start logged out.
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: E2E_BASE_URL, trace: "retain-on-failure", storageState: "tests/.auth/session.json" },
  projects: [
    // Distinct x-forwarded-for per project: both share one dev server, and
    // lib/auth/rateLimit.ts keys by client IP — without this, auth.spec.ts's
    // rate-limit test in one project would lock out the other project's
    // login attempts for the rest of the run.
    {
      name: "desktop",
      grepInvert: /@mobile-only/,
      use: { ...devices["Desktop Chrome"], extraHTTPHeaders: { "x-forwarded-for": "127.0.0.1" } },
    },
    {
      name: "mobile",
      grepInvert: /@desktop-only/,
      use: { ...devices["iPhone 13"], browserName: "chromium", extraHTTPHeaders: { "x-forwarded-for": "127.0.0.2" } },
    },
  ],
});
