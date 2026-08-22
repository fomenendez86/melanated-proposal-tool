import { expect, test } from "playwright/test";

test("editor exposes document, catalog, structure, review, sharing and PDF controls", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "The Mainland Tour" })).toBeVisible();
  await expect(page.getByLabel("Proposal canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Share proposal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate and download PDF" })).toBeVisible();
  await page.getByLabel("Open contextual catalog").click();
  await expect(page.getByRole("dialog", { name: "Contextual catalog" })).toBeVisible();
  await page.getByLabel("Close catalog").click();
  await page.getByLabel("Open document structure").click();
  const structureDialog = page.getByRole("dialog", { name: "Document structure" });
  await expect(structureDialog).toBeVisible();
  await structureDialog.getByLabel("Close document structure").click();
  await page.getByLabel("Review proposal readiness").click();
  await expect(page.getByRole("dialog", { name: "Proposal review" })).toBeVisible();
});

test("mobile editor keeps canvas primary and opens properties drawer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only responsive behavior");
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Proposal canvas")).toBeVisible();
  await page.getByLabel("Open page properties").click();
  await expect(page.getByRole("dialog", { name: "Page properties" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Inspector mode" })).toBeVisible();
});

test("editor dialogs and form controls meet the automated accessibility baseline", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  const opener = page.getByLabel("Open contextual catalog");
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Contextual catalog" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Close catalog")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  const unlabeledControls = await page.locator("input, select, textarea").evaluateAll((controls) =>
    controls.filter((control) => {
      const element = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      return !element.labels?.length && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby") && !element.getAttribute("title");
    }).map((element) => element.outerHTML.slice(0, 160))
  );
  expect(unlabeledControls).toEqual([]);

  const undersizedButtons = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons.filter((button) => {
      if ((button as HTMLButtonElement).disabled || button.getAttribute("aria-hidden") === "true" || button.getAttribute("aria-label") === "Open Next.js Dev Tools") return false;
      const box = button.getBoundingClientRect();
      return box.width < 44 || box.height < 44;
    }).map((button) => button.getAttribute("aria-label") || button.textContent?.trim() || "unnamed")
  );
  expect(undersizedButtons).toEqual([]);
});

test("rendered pages annotate editable regions from the shared field contract", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Proposal canvas")).toBeVisible();

  // Thumbnails in the Pages panel render the same annotated blocks; the
  // editing contract only applies inside the canvas, so scope to it.
  const regions = await page.locator('[aria-label="Proposal canvas"] [data-edit-field]').evaluateAll((elements) =>
    elements.map((element) => ({
      field: element.getAttribute("data-edit-field") ?? "",
      kind: element.getAttribute("data-edit-kind") ?? "",
      pageIndex: element.closest("[data-page-index]")?.getAttribute("data-page-index") ?? null,
    }))
  );

  expect(regions.length).toBeGreaterThan(30);
  for (const region of regions) {
    expect(region.field).not.toBe("");
    expect(["text", "multiline", "image"]).toContain(region.kind);
    expect(region.pageIndex).not.toBeNull();
  }

  const coverRegions = await page
    .locator('[data-page-index="0"] [data-edit-field]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-edit-field")).sort());
  expect(coverRegions).toEqual(["clientName", "coverImageUrl", "coverSubtitle", "coverTitle"]);
});

test("clicking a canvas region selects its field in the inspector", async ({ page }, testInfo) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  const coverTitleRegion = canvas.locator('[data-page-index="0"] [data-edit-field="coverTitle"]');
  await coverTitleRegion.click();

  // The desktop inspector instance stays mounted (CSS-hidden) below the xl
  // breakpoint, so scope to the visible field rather than the accessible
  // name — the canvas region's own aria-label also contains "Cover title".
  const titleField = page.locator('input[name="coverTitle"]:visible');
  await expect(titleField).toBeFocused();
  await expect(titleField).toHaveValue("Proposal");
  await expect(coverTitleRegion).toHaveClass(/proposal-studio-region-active/);

  // On mobile the first click opened a modal drawer; a dedicated test covers
  // that. Close it here so the canvas is clickable again for the next step.
  if (testInfo.project.name === "mobile") {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Page properties" })).toBeHidden();
  }

  // Clicking a region on a different page navigates selection and refocuses.
  const roomCategoryRegion = canvas.locator('[data-edit-field="roomCategory"]').first();
  await roomCategoryRegion.scrollIntoViewIfNeeded();
  await roomCategoryRegion.click();
  await expect(page.locator('input[name="roomCategory"]:visible')).toBeFocused();
  await expect(coverTitleRegion).not.toHaveClass(/proposal-studio-region-active/);
});

test("editable regions are keyboard-reachable only on the selected page, and Escape returns to the canvas", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Proposal canvas")).toBeVisible();

  const selectedRegions = page.locator('[data-page-index="0"] [data-edit-field]');
  await expect(selectedRegions.first()).toHaveAttribute("tabindex", "0");
  const otherPageRegions = page.locator('[data-page-index="1"] [data-edit-field]');
  await expect(otherPageRegions.first()).not.toHaveAttribute("tabindex", "0");

  const coverTitleRegion = page.locator('[data-page-index="0"] [data-edit-field="coverTitle"]');
  await expect(coverTitleRegion).toHaveAttribute("aria-label", "Edit Cover title");
  await coverTitleRegion.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('input[name="coverTitle"]:visible')).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-page-index="0"]')).toBeFocused();
});

test("mobile: clicking a canvas region opens the properties drawer focused on that field", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only responsive behavior");
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  await canvas.locator('[data-page-index="0"] [data-edit-field="coverTitle"]').click();
  await expect(page.getByRole("dialog", { name: "Page properties" })).toBeVisible();
  await expect(page.locator('input[name="coverTitle"]:visible')).toBeFocused();
});

test("rendered proposal has no measured page overflow", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Proposal canvas")).toBeVisible();
  const overflowPages = await page.locator("[data-page-content]").evaluateAll((containers) =>
    containers.flatMap((container, index) => {
      const section = container.firstElementChild;
      if (!(section instanceof HTMLElement)) return [];
      const pageBounds = section.getBoundingClientRect();
      const overflows = Array.from(section.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, table")).some((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > pageBounds.bottom + 1 || bounds.right > pageBounds.right + 1 || bounds.top < pageBounds.top - 1 || bounds.left < pageBounds.left - 1;
      });
      return overflows ? [index + 1] : [];
    })
  );
  expect(overflowPages).toEqual([]);
});
