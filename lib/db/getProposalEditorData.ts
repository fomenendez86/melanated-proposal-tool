import { eq } from "drizzle-orm";

import type { ProposalEditorPageMap } from "@/lib/editor/proposalEditorTypes";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

import { db } from "./client";
import { clients, proposalHotels, proposalPricing, proposalSections, proposals } from "./schema";

export async function getProposalEditorData(
  proposalId: number,
  pageMeta: ProposalPageMeta[]
): Promise<ProposalEditorPageMap> {
  const [row] = await db
    .select({
      coverTitle: proposals.coverTitle,
      coverSubtitle: proposals.coverSubtitle,
      coverImageUrl: proposals.coverImageUrl,
      packageName: proposals.packageName,
      selectedTier: proposals.selectedTier,
      travelDatesLabel: proposals.travelDatesLabel,
      passengerManifestLabel: proposals.passengerManifestLabel,
      specialOccasion: proposals.specialOccasion,
      arrivalAirport: proposals.arrivalAirport,
      departureAirport: proposals.departureAirport,
      packageTotalLabel: proposals.packageTotalLabel,
      clientName: clients.fullName,
    })
    .from(proposals)
    .innerJoin(clients, eq(clients.id, proposals.leadClientId))
    .where(eq(proposals.id, proposalId));

  if (!row) return {};

  const coverPage = pageMeta.find((page) => page.type === "cover");
  const detailsPage = pageMeta.find((page) => page.type === "details");
  const result: ProposalEditorPageMap = {};
  const [sectionRows, pricingRows] = await Promise.all([
    db.select().from(proposalSections).where(eq(proposalSections.proposalId, proposalId)),
    db.select().from(proposalPricing).where(eq(proposalPricing.proposalId, proposalId)),
  ]);
  const sectionsById = new Map(sectionRows.map((section) => [section.id, section]));

  if (coverPage) {
    result[coverPage.id] = {
      pageId: coverPage.id,
      kind: "cover",
      heading: "Cover content",
      description: "Changes save automatically and refresh the rendered proposal.",
      fields: [
        { name: "coverTitle", label: "Cover title", value: row.coverTitle, required: true, maxLength: 80 },
        { name: "coverSubtitle", label: "Subtitle", value: row.coverSubtitle ?? "", maxLength: 160, multiline: true },
        { name: "clientName", label: "Client name", value: row.clientName, required: true, maxLength: 120 },
        {
          name: "coverImageUrl",
          label: "Cover image",
          value: row.coverImageUrl ?? "",
          maxLength: 2048,
          placeholder: "/proposal-assets/cover.jpg",
          helpText: "Use a local /path or an https:// URL.",
        },
      ],
    };
  }

  if (detailsPage) {
    result[detailsPage.id] = {
      pageId: detailsPage.id,
      kind: "details",
      heading: "Trip details",
      description: "These values appear on the proposal details page.",
      fields: [
        { name: "packageName", label: "Package booked", value: row.packageName ?? "", required: true, maxLength: 120 },
        { name: "selectedTier", label: "Selected tier", value: row.selectedTier ?? "", maxLength: 80 },
        { name: "travelDatesLabel", label: "Travel dates", value: row.travelDatesLabel ?? "", maxLength: 120 },
        { name: "passengerManifestLabel", label: "Passenger manifest", value: row.passengerManifestLabel ?? "", maxLength: 160 },
        { name: "specialOccasion", label: "Special occasion", value: row.specialOccasion ?? "", maxLength: 120 },
        { name: "arrivalAirport", label: "Arrival airport", value: row.arrivalAirport ?? "", maxLength: 80 },
        { name: "departureAirport", label: "Departure airport", value: row.departureAirport ?? "", maxLength: 80 },
        { name: "packageTotalLabel", label: "Package total", value: row.packageTotalLabel ?? "", maxLength: 120 },
      ],
    };
  }

  for (const page of pageMeta) {
    const sourceSection = page.sourceSectionId ? sectionsById.get(page.sourceSectionId) : undefined;

    if (page.type === "hotel" && page.sourceRefId) {
      const [booking] = await db
        .select()
        .from(proposalHotels)
        .where(eq(proposalHotels.id, page.sourceRefId));
      if (booking?.proposalId === proposalId) {
        result[page.id] = {
          pageId: page.id,
          kind: "hotelBooking",
          sourceSectionId: page.sourceSectionId,
          sourceRefId: booking.id,
          heading: "Hotel booking",
          description: "These overrides apply only to this proposal, not the hotel catalog.",
          fields: [
            { name: "roomCategory", label: "Room category", value: booking.roomCategory, required: true, maxLength: 120 },
            { name: "mealPlan", label: "Meal plan", value: booking.mealPlan, required: true, maxLength: 120 },
            {
              name: "nights",
              label: "Nights",
              value: String(booking.nights),
              required: true,
              maxLength: 3,
              helpText: "Stored with the booking; the current hotel layout does not print this value.",
            },
          ],
        };
      }
    }

    if (page.type === "pricing" && pricingRows[0]) {
      const pricing = pricingRows[0];
      result[page.id] = {
        pageId: page.id,
        kind: "pricing",
        sourceSectionId: page.sourceSectionId,
        heading: "Pricing",
        description: "Financial values are stored only on this proposal.",
        fields: [
          { name: "pricingIntro", label: "Introduction", value: pricing.introText ?? "", maxLength: 600, multiline: true },
          { name: "invoiceTotal", label: "Invoice total", value: String(pricing.invoiceTotal), required: true, maxLength: 14 },
          { name: "commission", label: "Commission", value: String(pricing.commission), required: true, maxLength: 14 },
          { name: "amountDue", label: "Amount due", value: String(pricing.amountDue), required: true, maxLength: 14 },
          { name: "currency", label: "Currency", value: pricing.currency, required: true, maxLength: 3, helpText: "Three-letter ISO code, such as USD." },
        ],
      };
    }

    if (!sourceSection) continue;

    if (page.type === "triangleDivider") {
      const payload = sourceSection.payload as {
        sectionLabel?: string;
        titleLines?: Array<{ text: string; style: "bold" | "script" }>;
        imageUrl?: string;
      };
      result[page.id] = {
        pageId: page.id,
        kind: "triangleDivider",
        sourceSectionId: sourceSection.id,
        sourceRefId: sourceSection.refId,
        heading: "Section divider",
        description: "Edit the proposal-specific divider copy and image.",
        fields: [
          { name: "sectionLabel", label: "Section label", value: payload.sectionLabel ?? "", required: true, maxLength: 80 },
          ...(payload.titleLines ?? []).slice(0, 3).map((line, index) => ({
            name: (["titleLine1", "titleLine2", "titleLine3"] as const)[index],
            label: `Title line ${index + 1}`,
            value: line.text,
            required: index === 0,
            maxLength: 80,
          })),
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
        ],
      };
    }

    if (page.type === "sectionDivider") {
      const payload = sourceSection.payload as { title?: string; subtitle?: string; imageUrl?: string };
      result[page.id] = {
        pageId: page.id,
        kind: "sectionDivider",
        sourceSectionId: sourceSection.id,
        heading: "Section divider",
        description: "This content belongs only to the current proposal.",
        fields: [
          { name: "dividerTitle", label: "Title", value: payload.title ?? "", required: true, maxLength: 80 },
          { name: "dividerSubtitle", label: "Subtitle", value: payload.subtitle ?? "", maxLength: 160 },
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
        ],
      };
    }

    if (page.type === "cityToursDivider") {
      const payload = sourceSection.payload as { intro?: string; priceNote?: string; imageUrl?: string };
      result[page.id] = {
        pageId: page.id,
        kind: "cityToursDivider",
        sourceSectionId: sourceSection.id,
        sourceRefId: sourceSection.refId,
        heading: "Tours introduction",
        description: "The city name stays linked to the catalog; this copy is proposal-specific.",
        fields: [
          { name: "cityIntro", label: "Introduction", value: payload.intro ?? "", required: true, maxLength: 600, multiline: true },
          { name: "priceNote", label: "Price note", value: payload.priceNote ?? "", maxLength: 240, multiline: true },
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
        ],
      };
    }

    if (page.type === "thankYou") {
      const payload = sourceSection.payload as { message?: string; imageUrl?: string };
      result[page.id] = {
        pageId: page.id,
        kind: "thankYou",
        sourceSectionId: sourceSection.id,
        heading: "Closing page",
        description: "Edit the final message and image for this proposal.",
        fields: [
          { name: "thankYouMessage", label: "Message", value: payload.message ?? "", required: true, maxLength: 240, multiline: true },
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
        ],
      };
    }
  }

  return result;
}
