import { expect, test } from "playwright/test";

const LOGGED_OUT_STATE = { cookies: [], origins: [] };

test.describe("logged out", () => {
  test.use({ storageState: LOGGED_OUT_STATE });

  test("visiting a protected page redirects to /login, and the correct password grants access back to it", async ({ page }) => {
    await page.goto("/proposals", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login\?next=%2Fproposals/);

    await page.getByLabel("Password").fill(process.env.STUDIO_AUTH_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/proposals");
    await expect(page.getByRole("heading", { level: 1, name: "Proposals" })).toBeVisible();
  });

  test("wrong password shows an inline error and does not grant access", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Not getByRole("alert") — Next's own route announcer div also has
    // role="alert" (empty text), causing a strict-mode collision.
    await expect(page.getByText("Incorrect password.")).toBeVisible();

    await page.goto("/proposals", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("repeated wrong attempts trip the rate limit", async ({ page }) => {
    let sawRateLimitMessage = false;
    for (let attempt = 0; attempt < 8 && !sawRateLimitMessage; attempt += 1) {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Password").fill("still-not-the-password");
      await page.getByRole("button", { name: "Sign in" }).click();
      // The submit is a Server Action fetch, not a full navigation — the
      // resulting error text lands asynchronously, so wait for it rather
      // than checking isVisible() immediately (a non-retrying snapshot).
      sawRateLimitMessage = await page
        .getByText("Too many attempts.")
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => true)
        .catch(() => false);
    }
    expect(sawRateLimitMessage).toBe(true);

    // Even the correct password is rejected while locked out.
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Password").fill(process.env.STUDIO_AUTH_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Too many attempts.")).toBeVisible();
  });
});

test("logout clears the session and re-gates /proposals", async ({ page }) => {
  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Proposals" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/login/);

  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});
