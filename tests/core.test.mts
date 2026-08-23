import assert from "node:assert/strict";
import test from "node:test";

import { getProposalCatalogData } from "../lib/db/getProposalCatalogData";
import { getProposalCompositionData } from "../lib/db/getProposalCompositionData";
import { getProposalData } from "../lib/db/getProposalData";
import { getProposalDesignContext } from "../lib/db/getProposalDesignContext";
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
