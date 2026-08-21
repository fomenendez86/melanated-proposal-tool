"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
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
} from "@/lib/db/schema";
import type {
  ProposalEditorFieldName,
  UpdateProposalFieldsInput,
  UpdateProposalFieldsResult,
} from "@/lib/editor/proposalEditorTypes";
import type { ExcursionItem, ImportantItemRow, TermsSection, WeatherTable } from "@/lib/types";

const LIMITS: Record<ProposalEditorFieldName, number> = {
  coverTitle: 80,
  coverSubtitle: 160,
  clientName: 120,
  coverImageUrl: 2048,
  packageName: 120,
  selectedTier: 80,
  travelDatesLabel: 120,
  passengerManifestLabel: 160,
  specialOccasion: 120,
  arrivalAirport: 80,
  departureAirport: 80,
  packageTotalLabel: 120,
  roomCategory: 120,
  mealPlan: 120,
  nights: 3,
  hotelName: 160,
  hotelDescription: 6000,
  hotelImageTopRight: 2048,
  hotelImageBottomLeftTop: 2048,
  hotelImageBottomLeftBottom: 2048,
  pricingIntro: 600,
  invoiceTotal: 14,
  commission: 14,
  amountDue: 14,
  currency: 3,
  sectionLabel: 80,
  titleLine1: 80,
  titleLine2: 80,
  titleLine3: 80,
  dividerTitle: 80,
  dividerSubtitle: 160,
  sectionImageUrl: 2048,
  cityIntro: 600,
  priceNote: 240,
  thankYouMessage: 240,
  paymentScheduleText: 2000,
  leftListText: 5000,
  rightListText: 5000,
  excursionSnapshotText: 30000,
  weatherSnapshotText: 20000,
  termsSnapshotText: 50000,
  ownerParagraphsText: 12000,
  founderSignaturesText: 2000,
  ownerPhotoUrl: 2048,
  importantItemsSnapshotText: 30000,
  itinerarySnapshotText: 60000,
};

const FIELDS_BY_KIND = {
  cover: ["coverTitle", "coverSubtitle", "clientName", "coverImageUrl"],
  details: [
    "packageName",
    "selectedTier",
    "travelDatesLabel",
    "passengerManifestLabel",
    "specialOccasion",
    "arrivalAirport",
    "departureAirport",
    "packageTotalLabel",
  ],
  hotelBooking: [
    "roomCategory",
    "mealPlan",
    "nights",
    "hotelName",
    "hotelDescription",
    "hotelImageTopRight",
    "hotelImageBottomLeftTop",
    "hotelImageBottomLeftBottom",
  ],
  pricing: ["pricingIntro", "invoiceTotal", "commission", "amountDue", "currency", "paymentScheduleText"],
  triangleDivider: ["sectionLabel", "titleLine1", "titleLine2", "titleLine3", "sectionImageUrl"],
  sectionDivider: ["dividerTitle", "dividerSubtitle", "sectionImageUrl"],
  cityToursDivider: ["cityIntro", "priceNote", "sectionImageUrl"],
  thankYou: ["thankYouMessage", "sectionImageUrl"],
  twoColumnList: ["leftListText", "rightListText"],
  excursionSnapshot: ["excursionSnapshotText"],
  weatherSnapshot: ["weatherSnapshotText"],
  termsSnapshot: ["termsSnapshotText"],
  fromOwnersSnapshot: ["ownerParagraphsText", "founderSignaturesText", "ownerPhotoUrl"],
  importantItemsSnapshot: ["importantItemsSnapshotText"],
  itinerary: ["itinerarySnapshotText"],
} satisfies Record<UpdateProposalFieldsInput["kind"], ProposalEditorFieldName[]>;

const SECTION_TYPES_BY_KIND = {
  hotelBooking: ["hotel"],
  triangleDivider: ["triangleDivider"],
  sectionDivider: ["sectionDivider"],
  cityToursDivider: ["cityToursDivider"],
  thankYou: ["thankYou"],
  twoColumnList: ["twoColumnList"],
  excursionSnapshot: ["excursionList"],
  weatherSnapshot: ["weather"],
  termsSnapshot: ["termsConditions"],
  importantItemsSnapshot: ["importantItems"],
  itinerary: ["overview", "dayItinerary"],
} as const satisfies Partial<Record<UpdateProposalFieldsInput["kind"], readonly string[]>>;

interface ParsedListGroup {
  heading: string;
  lines: string[];
}

function parsePaymentSchedule(text: string) {
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator < 1) return null;
      const label = line.slice(0, separator).trim();
      const valueText = line.slice(separator + 1).trim();
      return label && valueText ? { label, valueText } : null;
    });
  return rows.every((row): row is { label: string; valueText: string } => row !== null)
    ? rows
    : null;
}

function parseListColumn(text: string): ParsedListGroup[] | null {
  const groups: ParsedListGroup[] = [];
  let current: ParsedListGroup | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^\[(.+)]$/)?.[1]?.trim();
    if (heading) {
      current = { heading, lines: [] };
      groups.push(current);
      continue;
    }
    if (!current) return null;
    const item = line.replace(/^-\s*/, "").trim();
    if (!item) return null;
    current.lines.push(item);
  }

  return groups.every((group) => group.heading && group.lines.length > 0) ? groups : null;
}

function isValidImageUrl(value: string) {
  return !value || value.startsWith("/") || /^https:\/\//i.test(value);
}

function parseExcursionSnapshot(text: string): ExcursionItem[] | null {
  type Draft = ExcursionItem & { readingDescription: boolean };
  const items: ExcursionItem[] = [];
  let current: Draft | null = null;

  const finish = () => {
    if (!current) return true;
    const item = {
      title: current.title.trim(),
      price: current.price.trim(),
      imageUrl: current.imageUrl.trim(),
      description: current.description.trim(),
    };
    if (!item.title || !item.price || !item.description || !isValidImageUrl(item.imageUrl)) return false;
    items.push(item);
    current = null;
    return true;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^\[(.+)]$/)?.[1]?.trim();
    if (heading) {
      if (!finish()) return null;
      current = { title: heading, price: "", imageUrl: "", description: "", readingDescription: false };
      continue;
    }
    if (!current) {
      if (line) return null;
      continue;
    }
    if (line.startsWith("Price:")) {
      current.price = line.slice(6).trim();
      current.readingDescription = false;
    } else if (line.startsWith("Image:")) {
      current.imageUrl = line.slice(6).trim();
      current.readingDescription = false;
    } else if (line === "Description:") {
      current.readingDescription = true;
    } else if (current.readingDescription) {
      current.description += `${current.description ? "\n" : ""}${rawLine.trim()}`;
    } else if (line) {
      return null;
    }
  }

  return finish() && items.length > 0 ? items : null;
}

function parseWeatherSnapshot(text: string): WeatherTable[] | null {
  const tables: WeatherTable[] = [];
  let current: WeatherTable | null = null;

  const finish = () => {
    if (!current) return true;
    if (!current.title.trim() || !current.note.trim() || current.seasons.length === 0) return false;
    tables.push(current);
    current = null;
    return true;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^\[(.+)]$/)?.[1]?.trim();
    if (heading) {
      if (!finish()) return null;
      current = { title: heading, note: "", seasons: [] };
      continue;
    }
    if (!current) return null;
    if (line.startsWith("Note:")) {
      current.note = line.slice(5).trim();
      continue;
    }
    if (line.startsWith("Season:")) {
      const parts = line.slice(7).split("|").map((part) => part.trim());
      if (parts.length < 4 || parts.length > 5 || parts.slice(0, 4).some((part) => !part)) return null;
      current.seasons.push({
        name: parts[0],
        months: parts[1],
        tempF: parts[2],
        tempC: parts[3],
        ...(parts[4] ? { icon: parts[4] } : {}),
      });
      continue;
    }
    return null;
  }

  return finish() && tables.length > 0 ? tables : null;
}

function parseTermsSnapshot(text: string): TermsSection[] | null {
  const sections: TermsSection[] = [];
  let current: { heading: string; paragraphs: string[]; paragraph: string[] } | null = null;

  const finishParagraph = () => {
    if (!current) return;
    const paragraph = current.paragraph.join("\n").trim();
    if (paragraph) current.paragraphs.push(paragraph);
    current.paragraph = [];
  };
  const finishSection = () => {
    if (!current) return true;
    finishParagraph();
    if (!current.heading || current.paragraphs.length === 0) return false;
    sections.push({ heading: current.heading, paragraphs: current.paragraphs });
    current = null;
    return true;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^\[(.+)]$/)?.[1]?.trim();
    if (heading) {
      if (!finishSection()) return null;
      current = { heading, paragraphs: [], paragraph: [] };
      continue;
    }
    if (!current) {
      if (line) return null;
      continue;
    }
    if (line === "---") finishParagraph();
    else current.paragraph.push(rawLine.trim());
  }

  return finishSection() && sections.length > 0 ? sections : null;
}

function parseParagraphs(text: string) {
  const paragraphs = text
    .split(/^---\s*$/m)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : null;
}

function parseFounderSignatures(text: string) {
  const founders = text
    .split("\n")
    .map((rawLine) => rawLine.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator < 1) return null;
      const name = line.slice(0, separator).trim();
      const title = line.slice(separator + 1).trim();
      return name && title ? { name, title } : null;
    });
  return founders.length > 0 && founders.every((founder): founder is { name: string; title: string } => founder !== null)
    ? founders
    : null;
}

function parseImportantItemsSnapshot(text: string): ImportantItemRow[] | null {
  type Draft = ImportantItemRow;
  const rows: ImportantItemRow[] = [];
  let current: Draft | null = null;

  const finish = () => {
    if (!current) return true;
    if (
      !current.heading.trim() ||
      !current.icon.trim() ||
      !/^#[0-9a-f]{6}$/i.test(current.swatchColor) ||
      current.bullets.length === 0 ||
      !isValidImageUrl(current.qrCodeUrl ?? "")
    ) return false;
    rows.push(current);
    current = null;
    return true;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^\[(.+)]$/)?.[1]?.trim();
    if (heading) {
      if (!finish()) return null;
      current = { heading, icon: "", swatchColor: "", bullets: [] };
      continue;
    }
    if (!current) return null;
    if (line.startsWith("Icon:")) current.icon = line.slice(5).trim();
    else if (line.startsWith("Color:")) current.swatchColor = line.slice(6).trim();
    else if (line.startsWith("QR:")) current.qrCodeUrl = line.slice(3).trim() || undefined;
    else if (/^-\s+/.test(line)) current.bullets.push(line.replace(/^-\s+/, "").trim());
    else return null;
  }

  return finish() && rows.length > 0 ? rows : null;
}

interface ParsedItineraryDay {
  dayNumber: number;
  date: string;
  subtitle: string;
  highlightLine: string;
  activities: Array<{ timeRange: string; description: string }>;
  paragraphs: string[];
  images: string[];
}

function parseItinerarySnapshot(text: string): ParsedItineraryDay[] | null {
  const days: ParsedItineraryDay[] = [];
  let current: ParsedItineraryDay | null = null;

  const finish = () => {
    if (!current) return true;
    if (current.activities.length === 0 || current.paragraphs.length === 0) return false;
    days.push(current);
    current = null;
    return true;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^\[Day\s+(\d+)]$/i)?.[1];
    if (heading) {
      if (!finish()) return null;
      current = {
        dayNumber: Number(heading),
        date: "",
        subtitle: "",
        highlightLine: "",
        activities: [],
        paragraphs: [],
        images: [],
      };
      continue;
    }
    if (!current) return null;
    if (line.startsWith("Date:")) current.date = line.slice(5).trim();
    else if (line.startsWith("Subtitle:")) current.subtitle = line.slice(9).trim();
    else if (line.startsWith("Highlight:")) current.highlightLine = line.slice(10).trim();
    else if (line.startsWith("Activity:")) {
      const activity = line.slice(9).trim();
      const separator = activity.indexOf("|");
      if (separator < 0) return null;
      const timeRange = activity.slice(0, separator).trim();
      const description = activity.slice(separator + 1).trim();
      if (!description) return null;
      current.activities.push({ timeRange, description });
    } else if (line.startsWith("Paragraph:")) {
      const paragraph = line.slice(10).trim();
      if (!paragraph) return null;
      current.paragraphs.push(paragraph);
    } else if (line.startsWith("Image:")) {
      const imageUrl = line.slice(6).trim();
      if (!imageUrl || !isValidImageUrl(imageUrl)) return null;
      current.images.push(imageUrl);
    } else return null;
  }

  if (!finish() || days.length === 0) return null;
  const numbers = days.map((day) => day.dayNumber);
  if (new Set(numbers).size !== numbers.length || numbers.some((number, index) => number !== index + 1)) return null;
  return days;
}

function normalizedValues(input: UpdateProposalFieldsInput) {
  const allowed = FIELDS_BY_KIND[input.kind];
  return Object.fromEntries(
    allowed.map((field) => [field, typeof input.values[field] === "string" ? input.values[field]!.trim() : ""])
  ) as Partial<Record<ProposalEditorFieldName, string>>;
}

function validateInput(input: UpdateProposalFieldsInput) {
  const errors: Partial<Record<ProposalEditorFieldName, string>> = {};
  const values = normalizedValues(input);

  for (const field of FIELDS_BY_KIND[input.kind]) {
    const value = values[field] ?? "";
    if (value.length > LIMITS[field]) errors[field] = `Use ${LIMITS[field]} characters or fewer.`;
  }

  if (input.kind === "cover") {
    if (!values.coverTitle) errors.coverTitle = "Cover title is required.";
    if (!values.clientName) errors.clientName = "Client name is required.";
    const imageUrl = values.coverImageUrl ?? "";
    if (imageUrl && !imageUrl.startsWith("/") && !/^https:\/\//i.test(imageUrl)) {
      errors.coverImageUrl = "Use a local /path or an https:// URL.";
    }
  }

  if (input.kind === "details" && !values.packageName) {
    errors.packageName = "Package name is required.";
  }

  if (input.kind === "hotelBooking") {
    if (!values.roomCategory) errors.roomCategory = "Room category is required.";
    if (!values.mealPlan) errors.mealPlan = "Meal plan is required.";
    if (!values.hotelName) errors.hotelName = "Hotel display name is required.";
    if (!values.hotelDescription) errors.hotelDescription = "Hotel description is required.";
    const nights = Number(values.nights);
    if (!Number.isInteger(nights) || nights < 1 || nights > 365) {
      errors.nights = "Enter a whole number from 1 to 365.";
    }
  }

  if (input.kind === "pricing") {
    for (const field of ["invoiceTotal", "commission", "amountDue"] as const) {
      const amount = Number(values[field]);
      if (!Number.isFinite(amount) || amount < 0) errors[field] = "Enter a valid amount of 0 or more.";
    }
    if (!/^[A-Z]{3}$/.test(values.currency ?? "")) {
      errors.currency = "Use a three-letter uppercase currency code.";
    }
    if (parsePaymentSchedule(values.paymentScheduleText ?? "") === null) {
      errors.paymentScheduleText = "Use one payment per line in Label | Value format.";
    }
  }

  if (input.kind === "twoColumnList") {
    const left = parseListColumn(values.leftListText ?? "");
    const right = parseListColumn(values.rightListText ?? "");
    if (left === null) errors.leftListText = "Start each group with [Heading], then add list items.";
    if (right === null) errors.rightListText = "Start each group with [Heading], then add list items.";
    if (left && right && left.length + right.length === 0) {
      errors.leftListText = "Add at least one content group.";
    }
  }

  if (input.kind === "excursionSnapshot" && parseExcursionSnapshot(values.excursionSnapshotText ?? "") === null) {
    errors.excursionSnapshotText = "Add at least one excursion using [Title], Price:, Image:, and Description:.";
  }
  if (input.kind === "weatherSnapshot" && parseWeatherSnapshot(values.weatherSnapshotText ?? "") === null) {
    errors.weatherSnapshotText = "Add a [Title], Note:, and at least one valid Season: row per table.";
  }
  if (input.kind === "termsSnapshot" && parseTermsSnapshot(values.termsSnapshotText ?? "") === null) {
    errors.termsSnapshotText = "Add at least one [Heading] with text; use --- between paragraphs.";
  }
  if (input.kind === "fromOwnersSnapshot") {
    if (parseParagraphs(values.ownerParagraphsText ?? "") === null) {
      errors.ownerParagraphsText = "Add at least one paragraph; use --- between paragraphs.";
    }
    if (parseFounderSignatures(values.founderSignaturesText ?? "") === null) {
      errors.founderSignaturesText = "Use one Name | Title signature per line.";
    }
  }
  if (
    input.kind === "importantItemsSnapshot" &&
    parseImportantItemsSnapshot(values.importantItemsSnapshotText ?? "") === null
  ) {
    errors.importantItemsSnapshotText = "Each item needs [Heading], Icon:, a six-digit Color:, and at least one bullet.";
  }
  if (input.kind === "itinerary" && parseItinerarySnapshot(values.itinerarySnapshotText ?? "") === null) {
    errors.itinerarySnapshotText = "Use sequential [Day N] blocks with at least one Activity and Paragraph per day.";
  }

  const requiredByKind: Partial<Record<UpdateProposalFieldsInput["kind"], ProposalEditorFieldName[]>> = {
    triangleDivider: ["sectionLabel", "titleLine1"],
    sectionDivider: ["dividerTitle"],
    cityToursDivider: ["cityIntro"],
    thankYou: ["thankYouMessage"],
  };
  for (const field of requiredByKind[input.kind] ?? []) {
    if (!values[field]) errors[field] = "This field is required.";
  }

  for (const field of [
    "sectionImageUrl",
    "ownerPhotoUrl",
    "hotelImageTopRight",
    "hotelImageBottomLeftTop",
    "hotelImageBottomLeftBottom",
  ] as const) {
    if (!(FIELDS_BY_KIND[input.kind] as ProposalEditorFieldName[]).includes(field)) continue;
    const imageUrl = values[field] ?? "";
    if (imageUrl && !imageUrl.startsWith("/") && !/^https:\/\//i.test(imageUrl)) {
      errors[field] = "Use a local /path or an https:// URL.";
    }
  }

  return { values, errors };
}

export async function updateProposalFields(
  proposalId: number,
  input: UpdateProposalFieldsInput
): Promise<UpdateProposalFieldsResult> {
  if (
    !Number.isInteger(proposalId) ||
    proposalId < 1 ||
    !input ||
    typeof input !== "object" ||
    !(input.kind in FIELDS_BY_KIND) ||
    !input.values ||
    typeof input.values !== "object"
  ) {
    return { ok: false, formError: "Invalid proposal update." };
  }

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };

  const expectedSectionTypes = SECTION_TYPES_BY_KIND[input.kind as keyof typeof SECTION_TYPES_BY_KIND];
  const needsSection = Boolean(expectedSectionTypes);
  const [sourceSection] = needsSection && Number.isInteger(input.sourceSectionId)
    ? await db
        .select()
        .from(proposalSections)
        .where(
          and(
            eq(proposalSections.id, input.sourceSectionId!),
            eq(proposalSections.proposalId, proposalId)
          )
        )
    : [];
  if (needsSection && (!sourceSection || !expectedSectionTypes?.some((type) => type === sourceSection.sectionType))) {
    return { ok: false, formError: "This proposal section could not be verified." };
  }

  if (input.kind === "hotelBooking") {
    const [booking] = Number.isInteger(input.sourceRefId)
      ? await db
          .select()
          .from(proposalHotels)
          .where(
            and(
              eq(proposalHotels.id, input.sourceRefId!),
              eq(proposalHotels.proposalId, proposalId)
            )
          )
      : [];
    if (!booking) return { ok: false, formError: "This hotel booking could not be verified." };
  }

  const { values, errors } = validateInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };

  const listKind = input.kind === "twoColumnList"
    ? ((sourceSection?.payload as { kind?: "inclusion" | "exclusion" } | null)?.kind ?? null)
    : null;
  if (input.kind === "twoColumnList" && !listKind) {
    return { ok: false, formError: "This proposal list could not be verified." };
  }
  const existingListSections = listKind
    ? await db
        .select()
        .from(proposalListSections)
        .where(
          and(
            eq(proposalListSections.proposalId, proposalId),
            eq(proposalListSections.kind, listKind)
          )
        )
    : [];
  const [fromOwnersOverride] = input.kind === "fromOwnersSnapshot"
    ? await db
        .select()
        .from(proposalSections)
        .where(
          and(
            eq(proposalSections.proposalId, proposalId),
            eq(proposalSections.sectionType, "fromOwnersOverride")
          )
        )
        .limit(1)
    : [];

  try {
    db.transaction((transaction) => {
      if (input.kind === "cover") {
        transaction
          .update(proposals)
          .set({
            coverTitle: values.coverTitle!,
            coverSubtitle: values.coverSubtitle || null,
            coverImageUrl: values.coverImageUrl || null,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId))
          .run();
        transaction
          .update(clients)
          .set({ fullName: values.clientName! })
          .where(eq(clients.id, proposal.leadClientId))
          .run();
      } else if (input.kind === "details") {
        transaction
          .update(proposals)
          .set({
            packageName: values.packageName!,
            selectedTier: values.selectedTier || null,
            travelDatesLabel: values.travelDatesLabel || null,
            passengerManifestLabel: values.passengerManifestLabel || null,
            specialOccasion: values.specialOccasion || null,
            arrivalAirport: values.arrivalAirport || null,
            departureAirport: values.departureAirport || null,
            packageTotalLabel: values.packageTotalLabel || null,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId))
          .run();
      } else if (input.kind === "fromOwnersSnapshot") {
        const payload = {
          paragraphs: parseParagraphs(values.ownerParagraphsText ?? "") ?? [],
          founders: parseFounderSignatures(values.founderSignaturesText ?? "") ?? [],
          photoUrl: values.ownerPhotoUrl ?? "",
        };
        if (fromOwnersOverride) {
          transaction
            .update(proposalSections)
            .set({ payload })
            .where(
              and(
                eq(proposalSections.id, fromOwnersOverride.id),
                eq(proposalSections.proposalId, proposalId)
              )
            )
            .run();
        } else {
          transaction
            .insert(proposalSections)
            .values({ proposalId, sectionType: "fromOwnersOverride", sortOrder: -1, payload })
            .run();
        }
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (input.kind === "hotelBooking") {
        transaction
          .update(proposalHotels)
          .set({
            roomCategory: values.roomCategory!,
            mealPlan: values.mealPlan!,
            nights: Number(values.nights),
          })
          .where(
            and(
              eq(proposalHotels.id, input.sourceRefId!),
              eq(proposalHotels.proposalId, proposalId)
            )
          )
          .run();
        if (sourceSection) {
          const currentPayload = (sourceSection.payload ?? {}) as Record<string, unknown>;
          transaction
            .update(proposalSections)
            .set({
              payload: {
                ...currentPayload,
                name: values.hotelName,
                description: values.hotelDescription,
                images: {
                  topRight: values.hotelImageTopRight,
                  bottomLeftTop: values.hotelImageBottomLeftTop,
                  bottomLeftBottom: values.hotelImageBottomLeftBottom,
                },
              },
            })
            .where(
              and(
                eq(proposalSections.id, sourceSection.id),
                eq(proposalSections.proposalId, proposalId)
              )
            )
            .run();
        }
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (input.kind === "pricing") {
        transaction
          .update(proposalPricing)
          .set({
            introText: values.pricingIntro || null,
            invoiceTotal: Number(values.invoiceTotal),
            commission: Number(values.commission),
            amountDue: Number(values.amountDue),
            currency: values.currency!,
          })
          .where(eq(proposalPricing.proposalId, proposalId))
          .run();
        transaction
          .delete(proposalPaymentSchedule)
          .where(eq(proposalPaymentSchedule.proposalId, proposalId))
          .run();
        const schedule = parsePaymentSchedule(values.paymentScheduleText ?? "") ?? [];
        if (schedule.length > 0) {
          transaction.insert(proposalPaymentSchedule).values(
            schedule.map((item, sortOrder) => ({ proposalId, sortOrder, ...item }))
          ).run();
        }
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (input.kind === "itinerary") {
        const itinerary = parseItinerarySnapshot(values.itinerarySnapshotText ?? "") ?? [];
        transaction.delete(proposalDays).where(eq(proposalDays.proposalId, proposalId)).run();
        itinerary.forEach((day, sortOrder) => {
          const insertedDay = transaction
            .insert(proposalDays)
            .values({
              proposalId,
              dayNumber: day.dayNumber,
              date: day.date || null,
              subtitle: day.subtitle || null,
              highlightLine: day.highlightLine || null,
              sortOrder,
            })
            .returning({ id: proposalDays.id })
            .get();
          transaction.insert(proposalDayActivities).values(
            day.activities.map((activity, activityOrder) => ({
              dayId: insertedDay.id,
              timeRange: activity.timeRange || null,
              description: activity.description,
              sortOrder: activityOrder,
            }))
          ).run();
          transaction.insert(proposalDayParagraphs).values(
            day.paragraphs.map((body, paragraphOrder) => ({
              dayId: insertedDay.id,
              body,
              sortOrder: paragraphOrder,
            }))
          ).run();
          if (day.images.length > 0) {
            transaction.insert(proposalDayImages).values(
              day.images.map((url, imageOrder) => ({ dayId: insertedDay.id, url, sortOrder: imageOrder }))
            ).run();
          }
        });
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (input.kind === "twoColumnList" && sourceSection && listKind) {
        const existingIds = existingListSections.map((section) => section.id);
        if (existingIds.length > 0) {
          transaction.delete(proposalListLines).where(inArray(proposalListLines.sectionId, existingIds)).run();
        }
        transaction
          .delete(proposalListSections)
          .where(
            and(
              eq(proposalListSections.proposalId, proposalId),
              eq(proposalListSections.kind, listKind)
            )
          )
          .run();

        const columns = [
          { column: "left" as const, groups: parseListColumn(values.leftListText ?? "") ?? [] },
          { column: "right" as const, groups: parseListColumn(values.rightListText ?? "") ?? [] },
        ];
        for (const { column, groups } of columns) {
          groups.forEach((group, sortOrder) => {
            const inserted = transaction
              .insert(proposalListSections)
              .values({ proposalId, kind: listKind, column, heading: group.heading, sortOrder })
              .returning({ id: proposalListSections.id })
              .get();
            transaction.insert(proposalListLines).values(
              group.lines.map((text, lineSortOrder) => ({
                sectionId: inserted.id,
                text,
                sortOrder: lineSortOrder,
              }))
            ).run();
          });
        }
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (
        sourceSection &&
        (
          input.kind === "excursionSnapshot" ||
          input.kind === "weatherSnapshot" ||
          input.kind === "termsSnapshot" ||
          input.kind === "importantItemsSnapshot"
        )
      ) {
        const currentPayload = (sourceSection.payload ?? {}) as Record<string, unknown>;
        const snapshot = input.kind === "excursionSnapshot"
          ? parseExcursionSnapshot(values.excursionSnapshotText ?? "")
          : input.kind === "weatherSnapshot"
            ? parseWeatherSnapshot(values.weatherSnapshotText ?? "")
            : input.kind === "termsSnapshot"
              ? parseTermsSnapshot(values.termsSnapshotText ?? "")
              : parseImportantItemsSnapshot(values.importantItemsSnapshotText ?? "");
        transaction
          .update(proposalSections)
          .set({ payload: { ...currentPayload, snapshot } })
          .where(
            and(
              eq(proposalSections.id, sourceSection.id),
              eq(proposalSections.proposalId, proposalId)
            )
          )
          .run();
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (sourceSection) {
        const currentPayload = (sourceSection.payload ?? {}) as Record<string, unknown>;
        let payload: Record<string, unknown>;

        if (input.kind === "triangleDivider") {
          const currentLines = Array.isArray(currentPayload.titleLines)
            ? currentPayload.titleLines as Array<{ text: string; style: "bold" | "script" }>
            : [];
          const lineValues = [values.titleLine1, values.titleLine2, values.titleLine3].filter(
            (line): line is string => Boolean(line)
          );
          payload = {
            ...currentPayload,
            sectionLabel: values.sectionLabel,
            imageUrl: values.sectionImageUrl,
            titleLines: lineValues.map((text, index) => ({
              text,
              style: currentLines[index]?.style ?? (index === 1 ? "script" : "bold"),
            })),
          };
        } else if (input.kind === "sectionDivider") {
          payload = {
            ...currentPayload,
            title: values.dividerTitle,
            subtitle: values.dividerSubtitle || undefined,
            imageUrl: values.sectionImageUrl,
          };
        } else if (input.kind === "cityToursDivider") {
          payload = {
            ...currentPayload,
            intro: values.cityIntro,
            priceNote: values.priceNote,
            imageUrl: values.sectionImageUrl,
          };
        } else {
          payload = {
            ...currentPayload,
            message: values.thankYouMessage,
            imageUrl: values.sectionImageUrl,
          };
        }

        transaction
          .update(proposalSections)
          .set({ payload })
          .where(
            and(
              eq(proposalSections.id, sourceSection.id),
              eq(proposalSections.proposalId, proposalId)
            )
          )
          .run();
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      }
    });
  } catch {
    return { ok: false, formError: "The changes could not be saved. Try again." };
  }

  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true, savedAt: new Date().toISOString() };
}
