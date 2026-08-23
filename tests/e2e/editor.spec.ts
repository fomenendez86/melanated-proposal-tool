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
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
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
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
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

test("inline-eligible canvas regions edit directly on the page, mirror the inspector live, and persist", async ({ page }) => {
  // networkidle: this test measures real layout (the overlay's position) on
  // first interaction, so let the 34-page document's images finish settling
  // first rather than racing them like the simpler dialog-only tests do.
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  const subtitleRegion = canvas.locator('[data-page-index="0"] [data-edit-field="coverSubtitle"]');

  await subtitleRegion.click();
  const overlay = page.locator(".proposal-studio-inline-editor");
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveJSProperty("tagName", "TEXTAREA");
  await expect(subtitleRegion).toHaveClass(/proposal-studio-region-editing/);
  // Read the raw value from the overlay, not the region's rendered (CSS
  // text-transform: uppercase) text, so restoring it later doesn't
  // permanently uppercase the demo data.
  const originalText = await overlay.inputValue();

  const draftText = "Inline edit e2e check";
  await overlay.fill(draftText);
  // The inspector reads the same shared draft — no separate save, no second
  // state. On mobile the inspector panel stays CSS-hidden (inline editing
  // never opens it), so check the value without requiring visibility.
  await expect(page.locator('textarea[name="coverSubtitle"]')).toHaveValue(draftText);

  // Escape closes the overlay, returns focus to the canvas, and — via the
  // component's unmount cleanup — saves, without needing a separate blur.
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
  await expect(page.locator('[data-page-index="0"]')).toBeFocused();
  await expect(subtitleRegion).not.toHaveClass(/proposal-studio-region-editing/);
  await expect(page.locator("footer")).toContainText("Saved", { timeout: 20000 });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-page-index="0"] [data-edit-field="coverSubtitle"]')).toHaveText(draftText);

  // Restore the seed value via the other close path — blur to blank canvas
  // space rather than Escape — and confirm the suite stays idempotent.
  const restoreRegion = page.locator('[data-page-index="0"] [data-edit-field="coverSubtitle"]');
  await restoreRegion.click();
  await page.locator(".proposal-studio-inline-editor").fill(originalText);
  await canvas.click({ position: { x: 10, y: 10 } });
  await expect(page.locator(".proposal-studio-inline-editor")).toBeHidden();
  await expect(page.locator("footer")).toContainText("Saved", { timeout: 20000 });
  await expect(restoreRegion).toHaveText(originalText);
});

test("fields outside the inline-editing scope keep the Phase 10.2 inspector flow", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  // coverTitle renders in vertical writing-mode; excluded from the overlay.
  await canvas.locator('[data-page-index="0"] [data-edit-field="coverTitle"]').click();
  await expect(page.locator(".proposal-studio-inline-editor")).toHaveCount(0);
  await expect(page.locator('input[name="coverTitle"]:visible')).toBeFocused();

  // On mobile the jump-to-inspector flow opened a modal drawer over the
  // canvas; close it so the next region is clickable. Harmless no-op on
  // desktop, where nothing is open and this just returns focus to the page.
  await page.keyboard.press("Escape");

  // Hotel booking fields are an explicit-save (review-then-save) form.
  const roomCategoryRegion = canvas.locator('[data-edit-field="roomCategory"]').first();
  await roomCategoryRegion.scrollIntoViewIfNeeded();
  await roomCategoryRegion.click();
  await expect(page.locator(".proposal-studio-inline-editor")).toHaveCount(0);
  await expect(page.locator('input[name="roomCategory"]:visible')).toBeFocused();
});

test("clicking an auto-save image region opens a canvas popover, edits, persists, and restores", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  const coverImageRegion = canvas.locator('[data-page-index="0"] [data-edit-field="coverImageUrl"]');
  await coverImageRegion.click();

  const popover = page.getByRole("dialog", { name: "Replace Cover image" });
  await expect(popover).toBeVisible();
  const urlInput = popover.locator("input");
  await expect(urlInput).toBeFocused();
  const originalUrl = await urlInput.inputValue();
  await expect(popover.locator("img")).toHaveAttribute("src", originalUrl);

  const draftUrl = "/proposal-assets/cover-zebras-v1.png?e2e=1";
  await urlInput.fill(draftUrl);
  // The inspector reads the same shared draft as the popover. On mobile the
  // inspector drawer stays closed (the popover never opens it, unlike the
  // Phase 10.2 jump-to-inspector flow), so check the value without
  // requiring visibility — same reasoning as the text overlay test above.
  await expect(page.locator('input[name="coverImageUrl"]')).toHaveValue(draftUrl);

  // Escape closes the popover, returns focus to the canvas, and saves via
  // the component's unmount cleanup — same pattern as the text overlay.
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await expect(page.locator('[data-page-index="0"]')).toBeFocused();
  await expect(page.locator("footer")).toContainText("Saved", { timeout: 20000 });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-page-index="0"] [data-edit-field="coverImageUrl"]')).toHaveAttribute("src", draftUrl);

  // Restore the seed value via click-outside-to-close instead of Escape.
  await canvas.locator('[data-page-index="0"] [data-edit-field="coverImageUrl"]').click();
  await page.getByRole("dialog", { name: "Replace Cover image" }).locator("input").fill(originalUrl);
  await canvas.click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole("dialog", { name: "Replace Cover image" })).toBeHidden();
  await expect(page.locator("footer")).toContainText("Saved", { timeout: 20000 });
  await expect(page.locator('[data-page-index="0"] [data-edit-field="coverImageUrl"]')).toHaveAttribute("src", originalUrl);
});

test("image regions on explicit-save pages keep the Phase 10.2 inspector flow, with a thumbnail preview", async ({ page }) => {
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  // Hotel booking images are an explicit-save (review-then-save) form.
  const hotelImageRegion = canvas.locator('[data-edit-field="hotelImageTopRight"]').first();
  await hotelImageRegion.scrollIntoViewIfNeeded();
  const expectedSrc = await hotelImageRegion.getAttribute("src");
  await hotelImageRegion.click();

  await expect(page.getByRole("dialog", { name: /^Replace/ })).toHaveCount(0);
  const inspectorField = page.locator('input[name="hotelImageTopRight"]:visible');
  await expect(inspectorField).toBeFocused();
  await expect(inspectorField).toHaveValue(expectedSrc ?? "");
  // The inspector renders the same thumbnail+URL control as the popover.
  await expect(inspectorField.locator("xpath=..").locator("img")).toHaveAttribute("src", expectedSrc ?? "");
});

test("mobile: inline-eligible regions edit on the canvas without opening the properties drawer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only responsive behavior");
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  await canvas.locator('[data-page-index="0"] [data-edit-field="coverSubtitle"]').click();
  await expect(page.locator(".proposal-studio-inline-editor")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("dialog", { name: "Page properties" })).toBeHidden();
  await page.keyboard.press("Escape");
});

test("mobile: auto-save image regions open the canvas popover without opening the properties drawer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only responsive behavior");
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
  const canvas = page.getByLabel("Proposal canvas");
  await expect(canvas).toBeVisible();

  await canvas.locator('[data-page-index="0"] [data-edit-field="coverImageUrl"]').click();
  await expect(page.getByRole("dialog", { name: "Replace Cover image" })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("dialog", { name: "Page properties" })).toBeHidden();
  await page.keyboard.press("Escape");
});

test("mobile: clicking a canvas region opens the properties drawer focused on that field", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only responsive behavior");
  await page.goto("/proposals/1/editor", { waitUntil: "networkidle" });
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

const PAGE_CARD_TITLE_SELECTOR = "nav[aria-label='Proposal pages'] > div > button > div.pt-0\\.5 > p:first-child";

async function draggableCardRects(page: import("playwright/test").Page) {
  return page.evaluate((selector) => {
    return Array.from(document.querySelectorAll(selector)).map((card) => {
      const rect = card.getBoundingClientRect();
      return { bottom: rect.bottom, hasHandle: !!card.querySelector(".cursor-grab") };
    });
  }, "nav[aria-label='Proposal pages'] > div");
}

test("dragging a page thumbnail reorders sections and persists, in both directions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop-only drag interaction");
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.locator(PAGE_CARD_TITLE_SELECTOR).first()).toBeVisible();

  const initialTitles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();

  async function dragFirstHandleTo(targetBottom: number) {
    const handle = page.locator("nav[aria-label='Proposal pages'] .cursor-grab").first();
    const box = await handle.boundingBox();
    if (!box) throw new Error("drag handle not found");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, targetBottom + 15, { steps: 15 });
    await page.mouse.up();
  }

  const cardsBefore = await draggableCardRects(page);
  const draggableBefore = cardsBefore.filter((card) => card.hasHandle);
  expect(draggableBefore.length).toBeGreaterThan(2);

  // Drag the first draggable section past the third draggable section.
  await dragFirstHandleTo(draggableBefore[2].bottom);

  await expect(async () => {
    const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
    expect(titles).not.toEqual(initialTitles);
  }).toPass({ timeout: 8000 });

  const reorderedTitles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(PAGE_CARD_TITLE_SELECTOR).first()).toBeVisible();
  await expect(async () => {
    const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
    expect(titles).toEqual(reorderedTitles);
  }).toPass({ timeout: 5000 });

  // Drag the SECOND draggable section up above the first one. This
  // exercises the upward/negative-direction path with a second,
  // independent persisted change.
  const navBox = await page.locator("nav[aria-label='Proposal pages']").boundingBox();
  if (!navBox) throw new Error("page navigator nav not found");
  const handles = page.locator("nav[aria-label='Proposal pages'] .cursor-grab");
  const upBox = await handles.nth(1).boundingBox();
  const firstBox = await handles.nth(0).boundingBox();
  if (!upBox || !firstBox) throw new Error("drag handle not found");

  await page.mouse.move(upBox.x + upBox.width / 2, upBox.y + upBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(upBox.x + upBox.width / 2, firstBox.y - 5, { steps: 15 });
  await page.mouse.up();

  await expect(async () => {
    const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
    expect(titles).not.toEqual(reorderedTitles);
  }).toPass({ timeout: 8000 });

  const secondReorderTitles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(PAGE_CARD_TITLE_SELECTOR).first()).toBeVisible();
  await expect(async () => {
    const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
    expect(titles).toEqual(secondReorderTitles);
  }).toPass({ timeout: 5000 });
});

test("the canvas insertion affordance adds a section at the exact gap position and persists", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Verification reads the desktop-only Pages panel list");
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.locator(PAGE_CARD_TITLE_SELECTOR).first()).toBeVisible();
  const initialTitles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();

  // "at the start" means before the first composition-backed section (the
  // same unit the Fase 11.1 drag handles use) — Cover/Details/From Owners
  // aren't proposalSections rows, so they're outside the insertable range.
  const initialCards = await draggableCardRects(page);
  const firstRunIndex = initialCards.findIndex((card) => card.hasHandle);
  expect(firstRunIndex).toBeGreaterThanOrEqual(0);

  await page.getByRole("button", { name: "Insert a section at the start" }).click();
  await page.getByRole("menuitem", { name: "Thank-you page" }).click();

  await expect(async () => {
    const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
    expect(titles.length).toBe(initialTitles.length + 1);
  }).toPass({ timeout: 8000 });

  const titlesAfterInsert = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
  expect(titlesAfterInsert[firstRunIndex]).toBe("Thank You");
  expect(titlesAfterInsert[firstRunIndex + 1]).toBe(initialTitles[firstRunIndex]);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(PAGE_CARD_TITLE_SELECTOR).first()).toBeVisible();
  await expect(async () => {
    const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
    expect(titles).toEqual(titlesAfterInsert);
  }).toPass({ timeout: 5000 });
});

test("the insertion affordance is keyboard-reachable and Escape cancels without changes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Verification reads the desktop-only Pages panel list");
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });
  await expect(page.locator(PAGE_CARD_TITLE_SELECTOR).first()).toBeVisible();
  const initialTitles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();

  const gapButton = page.getByRole("button", { name: "Insert a section at the start" });
  await gapButton.focus();
  await expect(gapButton).toBeFocused();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: "Section to insert" });
  await expect(menu).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  const titles = await page.locator(PAGE_CARD_TITLE_SELECTOR).allInnerTexts();
  expect(titles).toEqual(initialTitles);
});

test("mobile: page navigator drawer has no drag handles and keeps Document Structure buttons", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only responsive behavior");
  await page.goto("/proposals/1/editor", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Open page navigator").click();
  const pagesDialog = page.getByRole("dialog", { name: "Page navigator" });
  await expect(pagesDialog).toBeVisible();
  await expect(pagesDialog.locator(".cursor-grab")).toHaveCount(0);
  await pagesDialog.getByLabel("Close page navigator").click();

  await page.getByLabel("Open document structure").click();
  const structureDialog = page.getByRole("dialog", { name: "Document structure" });
  await expect(structureDialog).toBeVisible();
  await expect(structureDialog.getByLabel(/^Move .* down$/).first()).toBeVisible();
  await expect(structureDialog.getByLabel(/^Move .* up$/).first()).toBeVisible();
});
