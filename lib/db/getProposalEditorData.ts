import { asc, eq, inArray } from "drizzle-orm";

import type { ProposalEditorPageMap } from "@/lib/editor/proposalEditorTypes";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";
import type { ExcursionItem, ImportantItemRow, ProposalSection, TermsSection, WeatherTable } from "@/lib/types";

import { db } from "./client";
import {
  clients,
  proposalDayActivities,
  proposalDayImages,
  proposalDayParagraphs,
  proposalDays,
  proposalHotels,
  proposalListLines,
  proposalListSections,
  proposalPaymentSchedule,
  proposalPricing,
  proposalSections,
  proposals,
} from "./schema";

function formatListColumn(
  sections: Array<typeof proposalListSections.$inferSelect>,
  lines: Array<typeof proposalListLines.$inferSelect>,
  column: "left" | "right"
) {
  return sections
    .filter((section) => section.column === column)
    .map((section) => {
      const sectionLines = lines
        .filter((line) => line.sectionId === section.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((line) => `- ${line.text}`)
        .join("\n");
      return `[${section.heading}]${sectionLines ? `\n${sectionLines}` : ""}`;
    })
    .join("\n\n");
}

function formatExcursionSnapshot(items: ExcursionItem[]) {
  return items
    .map((item) =>
      [
        `[${item.title}]`,
        `Price: ${item.price}`,
        `Image: ${item.imageUrl}`,
        "Description:",
        item.description,
      ].join("\n")
    )
    .join("\n\n");
}

function formatWeatherSnapshot(tables: WeatherTable[]) {
  return tables
    .map((table) =>
      [
        `[${table.title}]`,
        `Note: ${table.note}`,
        ...table.seasons.map((season) =>
          `Season: ${season.name} | ${season.months} | ${season.tempF} | ${season.tempC} | ${season.icon ?? ""}`
        ),
      ].join("\n")
    )
    .join("\n\n");
}

function formatTermsSnapshot(sections: TermsSection[]) {
  return sections
    .map((section) => `[${section.heading}]\n${section.paragraphs.join("\n---\n")}`)
    .join("\n\n");
}

function formatImportantItemsSnapshot(rows: ImportantItemRow[]) {
  return rows
    .map((row) =>
      [
        `[${row.heading}]`,
        `Icon: ${row.icon}`,
        `Color: ${row.swatchColor}`,
        `QR: ${row.qrCodeUrl ?? ""}`,
        ...row.bullets.map((bullet) => `- ${bullet}`),
      ].join("\n")
    )
    .join("\n\n");
}

function formatItinerarySnapshot(
  days: Array<typeof proposalDays.$inferSelect>,
  activities: Array<typeof proposalDayActivities.$inferSelect>,
  paragraphs: Array<typeof proposalDayParagraphs.$inferSelect>,
  images: Array<typeof proposalDayImages.$inferSelect>
) {
  return days
    .map((day) =>
      [
        `[Day ${day.dayNumber}]`,
        `Date: ${day.date ?? ""}`,
        `Subtitle: ${day.subtitle ?? ""}`,
        `Highlight: ${day.highlightLine ?? ""}`,
        ...activities
          .filter((activity) => activity.dayId === day.id)
          .map((activity) => `Activity: ${activity.timeRange ?? ""} | ${activity.description}`),
        ...paragraphs
          .filter((paragraph) => paragraph.dayId === day.id)
          .map((paragraph) => `Paragraph: ${paragraph.body}`),
        ...images
          .filter((image) => image.dayId === day.id)
          .map((image) => `Image: ${image.url}`),
      ].join("\n")
    )
    .join("\n\n");
}

export async function getProposalEditorData(
  proposalId: number,
  pageMeta: ProposalPageMeta[],
  renderedSections: ProposalSection[]
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
  const [sectionRows, pricingRows, listSectionRows, scheduleRows, dayRows] = await Promise.all([
    db.select().from(proposalSections).where(eq(proposalSections.proposalId, proposalId)),
    db.select().from(proposalPricing).where(eq(proposalPricing.proposalId, proposalId)),
    db
      .select()
      .from(proposalListSections)
      .where(eq(proposalListSections.proposalId, proposalId))
      .orderBy(asc(proposalListSections.sortOrder)),
    db
      .select()
      .from(proposalPaymentSchedule)
      .where(eq(proposalPaymentSchedule.proposalId, proposalId))
      .orderBy(asc(proposalPaymentSchedule.sortOrder)),
    db
      .select()
      .from(proposalDays)
      .where(eq(proposalDays.proposalId, proposalId))
      .orderBy(asc(proposalDays.sortOrder)),
  ]);
  const listSectionIds = listSectionRows.map((section) => section.id);
  const listLineRows = listSectionIds.length
    ? await db
        .select()
        .from(proposalListLines)
        .where(inArray(proposalListLines.sectionId, listSectionIds))
        .orderBy(asc(proposalListLines.sortOrder))
    : [];
  const sectionsById = new Map(sectionRows.map((section) => [section.id, section]));
  const renderedBySourceId = new Map<number, ProposalSection[]>();
  for (const section of renderedSections) {
    const sourceId = section.editorSource?.sectionId;
    if (!sourceId) continue;
    const group = renderedBySourceId.get(sourceId) ?? [];
    group.push(section);
    renderedBySourceId.set(sourceId, group);
  }
  const dayIds = dayRows.map((day) => day.id);
  const [activityRows, paragraphRows, imageRows] = dayIds.length
    ? await Promise.all([
        db.select().from(proposalDayActivities).where(inArray(proposalDayActivities.dayId, dayIds)).orderBy(asc(proposalDayActivities.sortOrder)),
        db.select().from(proposalDayParagraphs).where(inArray(proposalDayParagraphs.dayId, dayIds)).orderBy(asc(proposalDayParagraphs.sortOrder)),
        db.select().from(proposalDayImages).where(inArray(proposalDayImages.dayId, dayIds)).orderBy(asc(proposalDayImages.sortOrder)),
      ])
    : [[], [], []];
  const itineraryText = formatItinerarySnapshot(dayRows, activityRows, paragraphRows, imageRows);

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
          isImage: true,
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

  const fromOwnersPage = pageMeta.find((page) => page.type === "fromOwners");
  const fromOwnersSection = renderedSections.find(
    (section): section is Extract<ProposalSection, { type: "fromOwners" }> => section.type === "fromOwners"
  );
  if (fromOwnersPage && fromOwnersSection) {
    result[fromOwnersPage.id] = {
      pageId: fromOwnersPage.id,
      kind: "fromOwnersSnapshot",
      saveMode: "explicit",
      sourceSectionId: fromOwnersPage.sourceSectionId,
      heading: "From the owners",
      description: "These proposal-only values do not change the company profile.",
      fields: [
        {
          name: "ownerParagraphsText",
          label: "Message paragraphs",
          value: fromOwnersSection.data.paragraphs.join("\n---\n"),
          maxLength: 12000,
          multiline: true,
          helpText: "Separate paragraphs with ---. Use at least one paragraph.",
        },
        {
          name: "founderSignaturesText",
          label: "Signatures",
          value: fromOwnersSection.data.founders.map((founder) => `${founder.name} | ${founder.title}`).join("\n"),
          maxLength: 2000,
          multiline: true,
          helpText: "One signature per line using Name | Title.",
        },
        {
          name: "ownerPhotoUrl",
          label: "Owners photo",
          value: fromOwnersSection.data.photoUrl,
          isImage: true,
          maxLength: 2048,
          helpText: "Use a local /path or an https:// URL.",
        },
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
        const hotelSection = (renderedBySourceId.get(page.sourceSectionId ?? -1) ?? []).find(
          (section): section is Extract<ProposalSection, { type: "hotel" }> => section.type === "hotel"
        );
        result[page.id] = {
          pageId: page.id,
          kind: "hotelBooking",
          saveMode: "explicit",
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
            { name: "hotelName", label: "Display name", value: hotelSection?.data.name ?? "", required: true, maxLength: 160 },
            { name: "hotelDescription", label: "Description", value: hotelSection?.data.description ?? "", required: true, maxLength: 6000, multiline: true },
            { name: "hotelImageTopRight", label: "Top-right image", value: hotelSection?.data.images.topRight ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
            { name: "hotelImageBottomLeftTop", label: "Bottom-left top image", value: hotelSection?.data.images.bottomLeftTop ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
            { name: "hotelImageBottomLeftBottom", label: "Bottom-left bottom image", value: hotelSection?.data.images.bottomLeftBottom ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
          ],
        };
      }
    }

    if (page.type === "overview" || page.type === "dayItinerary") {
      result[page.id] = {
        pageId: page.id,
        kind: "itinerary",
        saveMode: "explicit",
        sourceSectionId: page.sourceSectionId,
        heading: "Itinerary",
        description: "This canonical collection updates both Overview and the day-by-day pages.",
        fields: [
          {
            name: "itinerarySnapshotText",
            label: "Days and activities",
            value: itineraryText,
            maxLength: 60000,
            multiline: true,
            helpText: "Use [Day N], Date:, Subtitle:, Highlight:, Activity: Time | Text, Paragraph:, and Image:.",
          },
        ],
      };
    }

    if (page.type === "pricing" && pricingRows[0]) {
      const pricing = pricingRows[0];
      result[page.id] = {
        pageId: page.id,
        kind: "pricing",
        saveMode: "explicit",
        sourceSectionId: page.sourceSectionId,
        heading: "Pricing",
        description: "Financial values and payment rows are stored only on this proposal.",
        fields: [
          { name: "pricingIntro", label: "Introduction", value: pricing.introText ?? "", maxLength: 600, multiline: true },
          { name: "invoiceTotal", label: "Invoice total", value: String(pricing.invoiceTotal), required: true, maxLength: 14 },
          { name: "commission", label: "Commission", value: String(pricing.commission), required: true, maxLength: 14 },
          { name: "amountDue", label: "Amount due", value: String(pricing.amountDue), required: true, maxLength: 14 },
          { name: "currency", label: "Currency", value: pricing.currency, required: true, maxLength: 3, helpText: "Three-letter ISO code, such as USD." },
          {
            name: "paymentScheduleText",
            label: "Payment schedule",
            value: scheduleRows.map((item) => `${item.label} | ${item.valueText}`).join("\n"),
            maxLength: 2000,
            multiline: true,
            helpText: "One payment per line using Label | Value.",
          },
        ],
      };
    }

    if (!sourceSection) continue;

    if (page.type === "excursionList") {
      const items = (renderedBySourceId.get(sourceSection.id) ?? [])
        .filter((section): section is Extract<ProposalSection, { type: "excursionList" }> => section.type === "excursionList")
        .flatMap((section) => section.data.items);
      result[page.id] = {
        pageId: page.id,
        kind: "excursionSnapshot",
        saveMode: "explicit",
        sourceSectionId: sourceSection.id,
        heading: "Excursions",
        description: "Saving creates a private copy for this proposal, independent of future catalog changes.",
        fields: [
          {
            name: "excursionSnapshotText",
            label: "Excursion collection",
            value: formatExcursionSnapshot(items),
            maxLength: 30000,
            multiline: true,
            helpText: "Use [Title], Price:, Image:, and Description: for every excursion.",
          },
        ],
      };
    }

    if (page.type === "weather") {
      const tables = (renderedBySourceId.get(sourceSection.id) ?? [])
        .filter((section): section is Extract<ProposalSection, { type: "weather" }> => section.type === "weather")
        .flatMap((section) => section.data.tables);
      result[page.id] = {
        pageId: page.id,
        kind: "weatherSnapshot",
        saveMode: "explicit",
        sourceSectionId: sourceSection.id,
        heading: "Weather guide",
        description: "Saving creates a proposal-specific weather snapshot instead of changing the catalog.",
        fields: [
          {
            name: "weatherSnapshotText",
            label: "Weather tables",
            value: formatWeatherSnapshot(tables),
            maxLength: 20000,
            multiline: true,
            helpText: "Use [Title], Note:, then Season: Name | Months | °F | °C | optional icon.",
          },
        ],
      };
    }

    if (page.type === "termsConditions") {
      const terms = (renderedBySourceId.get(sourceSection.id) ?? [])
        .filter((section): section is Extract<ProposalSection, { type: "termsConditions" }> => section.type === "termsConditions")
        .flatMap((section) => section.data.sections);
      result[page.id] = {
        pageId: page.id,
        kind: "termsSnapshot",
        saveMode: "explicit",
        sourceSectionId: sourceSection.id,
        heading: "Terms and conditions",
        description: "Saving creates a private terms snapshot for this proposal and may repaginate the document.",
        fields: [
          {
            name: "termsSnapshotText",
            label: "Terms sections",
            value: formatTermsSnapshot(terms),
            maxLength: 50000,
            multiline: true,
            helpText: "Use [Heading] for each section and --- between paragraphs.",
          },
        ],
      };
    }

    if (page.type === "importantItems") {
      const rows = (renderedBySourceId.get(sourceSection.id) ?? [])
        .filter((section): section is Extract<ProposalSection, { type: "importantItems" }> => section.type === "importantItems")
        .flatMap((section) => section.data.rows);
      result[page.id] = {
        pageId: page.id,
        kind: "importantItemsSnapshot",
        saveMode: "explicit",
        sourceSectionId: sourceSection.id,
        heading: "Important items",
        description: "Saving creates proposal-only requirements without changing destination defaults.",
        fields: [
          {
            name: "importantItemsSnapshotText",
            label: "Requirement collection",
            value: formatImportantItemsSnapshot(rows),
            maxLength: 30000,
            multiline: true,
            helpText: "Use [Heading], Icon:, Color:, QR:, then one bullet per line.",
          },
        ],
      };
    }

    if (page.type === "twoColumnList") {
      const payload = sourceSection.payload as { kind?: "inclusion" | "exclusion" };
      const kind = payload.kind;
      if (kind) {
        const matchingSections = listSectionRows.filter((section) => section.kind === kind);
        result[page.id] = {
          pageId: page.id,
          kind: "twoColumnList",
          saveMode: "explicit",
          sourceSectionId: sourceSection.id,
          heading: kind === "inclusion" ? "Inclusions" : "Exclusions",
          description: "Use [Heading] followed by one list item per line. Blank lines separate groups.",
          fields: [
            {
              name: "leftListText",
              label: "Left column",
              value: formatListColumn(matchingSections, listLineRows, "left"),
              maxLength: 5000,
              multiline: true,
            },
            {
              name: "rightListText",
              label: "Right column",
              value: formatListColumn(matchingSections, listLineRows, "right"),
              maxLength: 5000,
              multiline: true,
            },
          ],
        };
      }
    }

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
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
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
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
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
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
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
          { name: "sectionImageUrl", label: "Image", value: payload.imageUrl ?? "", isImage: true, maxLength: 2048, helpText: "Use a local /path or an https:// URL." },
        ],
      };
    }
  }

  return result;
}
