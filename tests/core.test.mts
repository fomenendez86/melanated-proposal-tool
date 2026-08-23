import assert from "node:assert/strict";
import test from "node:test";

import { eq } from "drizzle-orm";

import { db } from "../lib/db/client";
import { createProposalFromTemplate } from "../lib/db/createProposalFromTemplate";
import { getProposalCatalogData } from "../lib/db/getProposalCatalogData";
import { getProposalCompositionData } from "../lib/db/getProposalCompositionData";
import { getProposalData } from "../lib/db/getProposalData";
import { getProposalDesignContext } from "../lib/db/getProposalDesignContext";
import { generateProposalNumber } from "../lib/db/generateProposalNumber";
import { getProposalListSummaries } from "../lib/db/getProposalList";
import { getTemplateList } from "../lib/db/getTemplateList";
import { saveProposalAsTemplate } from "../lib/db/saveProposalAsTemplate";
import { proposalDays, proposals } from "../lib/db/schema";
import { RESET_ON_TEMPLATE_FIELDS } from "../lib/editor/resetOnTemplateFields";
import { parseItineraryEditorText, serializeItineraryEditorDays, validateItineraryEditorDays } from "../lib/editor/itineraryEditorCodec";
import { paginateDayItinerary, paginateExcursionList, paginateOverview, paginateTermsConditions, renumberSections } from "../lib/paginate";

test("itinerary codec round-trips valid structured days", () => {
  const source = "[Day 1]\nDate: Aug 18\nSubtitle: Arrival\nHighlight: Welcome\nActivity: 9:00 AM | Airport transfer\nParagraph: Meet your guide.\nImage: /proposal-assets/day.jpg";
  const parsed = parseItineraryEditorText(source);
  assert.ok(parsed);
  assert.deepEqual(validateItineraryEditorDays(parsed), []);
  assert.deepEqual(parseItineraryEditorText(serializeItineraryEditorDays(parsed)), parsed);
  assert.equal(parseItineraryEditorText("[Day 1]\nParagraph: Missing activity"), null);
});

test("pagination never emits empty pages and renumbers sequentially", () => {
  const overview = paginateOverview({ days: Array.from({ length: 14 }, (_, index) => ({ dayNumber: index + 1, date: "Date", activities: [{ time: "09:00", description: "A detailed activity ".repeat(8) }] })), pageNumber: 0 }, 0);
  const excursions = paginateExcursionList({ items: Array.from({ length: 12 }, (_, index) => ({ title: `Excursion ${index + 1}`, description: "Description ".repeat(20), price: "$100", imageUrl: "/image.jpg" })), pageNumber: 0 }, 0);
  const terms = paginateTermsConditions({ sections: Array.from({ length: 10 }, (_, index) => ({ heading: `Term ${index + 1}`, paragraphs: ["Terms text ".repeat(45)] })), pageNumber: 0, showTitle: true }, 0);
  const itinerary = paginateDayItinerary(Array.from({ length: 10 }, (_, index) => ({ dayNumber: index + 1, date: "Date", subtitle: "Day", highlightLine: "", activities: [], paragraphs: ["Text"], imageUrls: [] })), 0);
  for (const group of [overview, excursions, terms, itinerary]) assert.ok(group.length > 0);
  assert.ok(overview.every((page) => page.type === "overview" && page.data.days.length > 0));
  assert.ok(excursions.every((page) => page.type === "excursionList" && page.data.items.length > 0));
  assert.ok(terms.every((page) => page.type === "termsConditions" && page.data.sections.length > 0));
  assert.deepEqual(renumberSections([...overview, ...excursions], 1).map((section) => section.type === "cover" ? null : section.data.pageNumber), Array.from({ length: overview.length + excursions.length }, (_, index) => index + 1));
});

test("generateProposalNumber ties the proposal number 1:1 to the row id", () => {
  assert.equal(generateProposalNumber(1), "PRO-0001");
  assert.equal(generateProposalNumber(42), "PRO-0042");
  assert.equal(generateProposalNumber(10000), "PRO-10000");
});

test("database assembly exposes design-neutral editor contracts", async () => {
  const data = await getProposalData(1);
  assert.ok(data.sections.length > 20);
  assert.equal(data.sections[0]?.type, "cover");
  const design = await getProposalDesignContext(1, data.sections.map((section) => section.type));
  assert.ok(design.choices.length >= 2);
  assert.ok(design.choices.every((choice) => choice.compatible));
  const [catalog, composition] = await Promise.all([getProposalCatalogData(1), getProposalCompositionData(1)]);
  assert.ok(catalog.hotels.length >= 2);
  assert.ok(catalog.hotels.some((hotel) => hotel.cityName === "Arusha"));
  assert.ok(catalog.hotels.some((hotel) => hotel.cityName === "Karatu"));
  assert.ok(catalog.excursions.length >= 10);
  assert.ok(composition.items.length >= 10);
  assert.ok(composition.items.every((item) => !["documentDesign", "shareSettings", "proposalRevision", "proposalLifecycleEvent", "proposalApproval", "pdfGeneration"].includes(item.sectionType)));
});

test("RESET_ON_TEMPLATE_FIELDS covers the fields create-from-template must clear", () => {
  assert.deepEqual(
    [...RESET_ON_TEMPLATE_FIELDS].sort(),
    ["arrivalAirport", "departureAirport", "leadClient", "proposalDaysDate", "travelDatesLabel"].sort()
  );
});

test("save-as-template then create-from-template produces an independent, reset proposal", async () => {
  const [source] = await db.select().from(proposals).where(eq(proposals.id, 1));
  assert.ok(source, "seed proposal 1 must exist");

  const templateListBefore = await getTemplateList();
  const templateResult = await saveProposalAsTemplate(1, { name: "Test template", description: "For core.test.mts" });
  assert.ok(templateResult.ok && templateResult.id);
  const templateId = templateResult.id!;

  try {
    const templateListAfter = await getTemplateList();
    assert.equal(templateListAfter.length, templateListBefore.length + 1);

    const proposalListSummaries = await getProposalListSummaries();
    assert.ok(proposalListSummaries.every((row) => row.id !== templateId), "templates must not appear in the proposal pipeline list");

    const createResult = await createProposalFromTemplate(templateId, { leadClientId: source.leadClientId });
    assert.ok(createResult.ok && createResult.id);
    const newProposalId = createResult.id!;

    try {
      const [newProposal] = await db.select().from(proposals).where(eq(proposals.id, newProposalId));
      assert.ok(newProposal);
      assert.equal(newProposal.isTemplate, false);
      assert.equal(newProposal.travelDatesLabel, null);
      assert.equal(newProposal.arrivalAirport, null);
      assert.equal(newProposal.departureAirport, null);

      const sourceData = await getProposalData(1);
      const newData = await getProposalData(newProposalId);
      assert.equal(newData.sections.length, sourceData.sections.length, "template copy retains the same section count as its source");

      const days = await db.select({ date: proposalDays.date }).from(proposalDays).where(eq(proposalDays.proposalId, newProposalId));
      assert.ok(days.length > 0);
      assert.ok(days.every((day) => day.date === null), "day dates must be cleared on a template-created proposal");
    } finally {
      db.transaction((tx) => tx.delete(proposals).where(eq(proposals.id, newProposalId)).run());
    }
  } finally {
    db.transaction((tx) => tx.delete(proposals).where(eq(proposals.id, templateId)).run());
  }
});
