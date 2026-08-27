import { expect, test } from "playwright/test";
import type { Locator, Page } from "playwright/test";

// `next dev` compiles client chunks on demand, so a server-rendered control
// can be clickable seconds before React attaches its handler — the first
// click is then silently dropped. Retry until the dialog actually mounts
// instead of assuming a single click registered; the trigger only ever sets
// `open` to true, so an extra click is harmless.
async function openNewProposalDialog(page: Page): Promise<Locator> {
  const dialog = page.getByRole("dialog", { name: "New proposal" });
  await expect(async () => {
    await page.getByRole("button", { name: "New proposal" }).click();
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
  return dialog;
}

test("dashboard lists proposals and supports search", { tag: "@desktop-only" }, async ({ page }) => {
  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Proposals" })).toBeVisible();
  await expect(page.getByRole("link", { name: "The Mainland Tour" }).first()).toBeVisible();

  await page.getByLabel("Search proposals").fill("zzz-no-such-proposal-zzz");
  await expect(page.getByText("No proposals match")).toBeVisible();

  await page.getByLabel("Search proposals").fill("");
  await expect(page.getByRole("link", { name: "The Mainland Tour" }).first()).toBeVisible();
});

test("creating a blank proposal seeds only the base pages", { tag: "@desktop-only" }, async ({ page }) => {
  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  const dialog = await openNewProposalDialog(page);
  await dialog.getByLabel("Trip name").fill("E2E Blank Trip");
  await dialog.getByRole("button", { name: "Create proposal" }).click();

  await page.waitForURL(/\/proposals\/\d+\/editor/);
  await expect(page.getByRole("heading", { level: 1, name: "E2E Blank Trip" })).toBeVisible();
  await expect(page.locator("[data-page-index]")).toHaveCount(3);
});

test("duplicating a proposal creates an independent copy", { tag: "@desktop-only" }, async ({ page }) => {
  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  const row = page.locator("article", { hasText: "DEMO-0001" });
  await row.getByRole("button", { name: /^Duplicate/ }).click();

  await page.waitForURL(/\/proposals\/\d+\/editor/);
  expect(page.url()).not.toMatch(/\/proposals\/1\/editor/);
  await expect(page.getByRole("heading", { level: 1, name: "The Mainland Tour" })).toBeVisible();
});

test("archive, restore and delete manage lifecycle from the dashboard", { tag: "@desktop-only" }, async ({ page }) => {
  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  const dialog = await openNewProposalDialog(page);
  await dialog.getByLabel("Trip name").fill("E2E Lifecycle Trip");
  await dialog.getByRole("button", { name: "Create proposal" }).click();
  await page.waitForURL(/\/proposals\/\d+\/editor/);

  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  const row = page.locator("article", { has: page.getByRole("link", { name: "E2E Lifecycle Trip" }) });
  await expect(row.getByText("draft", { exact: true })).toBeVisible();

  await row.getByRole("button", { name: /^Archive/ }).click();
  await expect(row.getByText("archived", { exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: /^Delete/ })).toHaveCount(0);

  await row.getByRole("button", { name: /^Restore/ }).click();
  await expect(row.getByText("draft", { exact: true })).toBeVisible();

  page.once("dialog", (confirmDialog) => confirmDialog.accept());
  await row.getByRole("button", { name: /^Delete/ }).click();
  await expect(row).toBeHidden();
});
