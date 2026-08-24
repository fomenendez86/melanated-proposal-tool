import { expect, test } from "playwright/test";

test("save as template, create from it, rename, and archive", { tag: "@desktop-only" }, async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "Save as template" }).click();
  const saveDialog = page.getByRole("dialog", { name: "Save as template" });
  await expect(saveDialog).toBeVisible();
  await saveDialog.getByLabel("Template name").fill("Playwright Template");
  await saveDialog.getByRole("button", { name: "Save template" }).click();
  await expect(saveDialog.getByText("Template saved")).toBeVisible();
  await saveDialog.getByRole("button", { name: "Done" }).click();

  await page.goto("/proposals/templates", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Templates" })).toBeVisible();
  await expect(page.getByText("Playwright Template", { exact: true })).toBeVisible();

  // Create a proposal from the template via the main dashboard's dialog.
  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "New proposal" }).click();
  const createDialog = page.getByRole("dialog", { name: "New proposal" });
  await createDialog.getByLabel("Trip name").fill("From Playwright Template");
  await createDialog.getByLabel("Proposal origin").getByText("From template").click();
  await createDialog.getByLabel("Template").selectOption({ label: "Playwright Template" });
  await createDialog.getByRole("button", { name: "Create proposal" }).click();

  await page.waitForURL(/\/proposals\/\d+\/editor/);
  await expect(page.getByRole("heading", { level: 1, name: "From Playwright Template" })).toBeVisible();
  await expect(page.getByText("Dates not assigned")).toBeVisible();
  const sourcePageCount = await page.locator("[data-page-index]").count();
  expect(sourcePageCount).toBeGreaterThan(3);

  // Rename the template from the gallery.
  await page.goto("/proposals/templates", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Manage Playwright Template" }).click();
  const manageDialog = page.getByRole("dialog", { name: "Manage template" });
  await manageDialog.getByLabel("Template name").fill("Playwright Template Renamed");
  await manageDialog.getByRole("button", { name: "Save name & description" }).click();
  await expect(page.getByText("Playwright Template Renamed", { exact: true })).toBeVisible();

  // Archive it — the proposal already created from it must stay intact.
  await page.getByRole("button", { name: /^Archive Playwright Template/ }).click();
  await expect(page.getByText("archived", { exact: true })).toBeVisible();

  await page.goto("/proposals", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "From Playwright Template", exact: true })).toBeVisible();
});
