import { mkdirSync } from "node:fs";
import path from "node:path";

import { chromium } from "playwright/test";

// The Next.js dev server (spawned separately by playwright.config.ts's
// webServer) loads .env.local on its own; this setup script runs as a
// plain Node process and needs the same credential to drive the login form.
try {
  process.loadEnvFile(path.join(import.meta.dirname, "..", "..", ".env.local"));
} catch {
  // Missing in CI/prod where STUDIO_AUTH_PASSWORD is already set in the env.
}

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const STORAGE_STATE_PATH = path.join(import.meta.dirname, "..", ".auth", "session.json");

// Logs in once, saved as storageState for every e2e project — matches the
// Fase 12.3 acceptance criterion "los tests e2e se autentican en setup."
// A single shared session is enough since playwright.config.ts already runs
// everything with workers: 1 (serial).
export default async function globalSetup() {
  mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Password").fill(process.env.STUDIO_AUTH_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE_URL}/proposals`, { timeout: 15_000 });
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
