import { asc, eq, inArray } from "drizzle-orm";

import { generateProposalNumber } from "./generateProposalNumber";
import { db } from "./client";
import {
  proposalClients,
  proposalDayActivities,
  proposalDayImages,
  proposalDayParagraphs,
  proposalDays,
  proposalExcursions,
  proposalHotels,
  proposalListLines,
  proposalListSections,
  proposalPaymentSchedule,
  proposalPricing,
  proposalSections,
  proposals,
} from "./schema";

export interface DuplicateProposalResult {
  ok: boolean;
  id?: number;
  formError?: string;
}

// Full-graph deep copy: every proposal-scoped child row gets a fresh id, so
// editing the duplicate never mutates the source (and vice versa). Shared
// catalog rows (hotels, excursions, cities, bank accounts) stay referenced,
// not copied. Revisions/shares/events are deliberately NOT copied — a
// duplicate starts with clean sharing history, consistent with its reset
// `draft` status.
export async function duplicateProposal(
  sourceProposalId: number,
  overrides?: { leadClientId?: number }
): Promise<DuplicateProposalResult> {
  const [source] = await db.select().from(proposals).where(eq(proposals.id, sourceProposalId));
  if (!source) return { ok: false, formError: "Proposal not found." };

  const clientRows = await db.select().from(proposalClients).where(eq(proposalClients.proposalId, sourceProposalId));

  const days = await db
    .select()
    .from(proposalDays)
    .where(eq(proposalDays.proposalId, sourceProposalId))
    .orderBy(asc(proposalDays.sortOrder));
  const dayIds = days.map((day) => day.id);
  const activities = dayIds.length
    ? await db.select().from(proposalDayActivities).where(inArray(proposalDayActivities.dayId, dayIds))
    : [];
  const paragraphs = dayIds.length
    ? await db.select().from(proposalDayParagraphs).where(inArray(proposalDayParagraphs.dayId, dayIds))
    : [];
  const images = dayIds.length
    ? await db.select().from(proposalDayImages).where(inArray(proposalDayImages.dayId, dayIds))
    : [];

  const hotelBookings = await db.select().from(proposalHotels).where(eq(proposalHotels.proposalId, sourceProposalId));
  const excursionRows = await db.select().from(proposalExcursions).where(eq(proposalExcursions.proposalId, sourceProposalId));

  const listSections = await db.select().from(proposalListSections).where(eq(proposalListSections.proposalId, sourceProposalId));
  const listSectionIds = listSections.map((section) => section.id);
  const listLines = listSectionIds.length
    ? await db.select().from(proposalListLines).where(inArray(proposalListLines.sectionId, listSectionIds))
    : [];

  const [pricing] = await db.select().from(proposalPricing).where(eq(proposalPricing.proposalId, sourceProposalId));
  const paymentSchedule = await db.select().from(proposalPaymentSchedule).where(eq(proposalPaymentSchedule.proposalId, sourceProposalId));

  const sectionRows = await db
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.proposalId, sourceProposalId))
    .orderBy(asc(proposalSections.sortOrder));

  try {
    const newId = db.transaction((tx) => {
      const inserted = tx
        .insert(proposals)
        .values({
          proposalNumber: `TMP-${crypto.randomUUID()}`,
          leadClientId: overrides?.leadClientId ?? source.leadClientId,
          status: "draft",
          designId: source.designId,
          designVersion: source.designVersion,
          packageName: source.packageName,
          selectedTier: source.selectedTier,
          specialOccasion: source.specialOccasion,
          arrivalAirport: source.arrivalAirport,
          departureAirport: source.departureAirport,
          termsTemplateId: source.termsTemplateId,
          coverTitle: source.coverTitle,
          coverSubtitle: source.coverSubtitle,
          coverImageUrl: source.coverImageUrl,
          travelDatesLabel: source.travelDatesLabel,
          packageTotalLabel: source.packageTotalLabel,
          passengerManifestLabel: source.passengerManifestLabel,
        })
        .returning({ id: proposals.id })
        .get();
      const newProposalId = inserted.id;
      tx.update(proposals).set({ proposalNumber: generateProposalNumber(newProposalId) }).where(eq(proposals.id, newProposalId)).run();

      for (const row of clientRows) {
        const clientId = row.role === "lead" && overrides?.leadClientId ? overrides.leadClientId : row.clientId;
        tx.insert(proposalClients).values({ proposalId: newProposalId, clientId, role: row.role }).run();
      }

      const dayIdMap = new Map<number, number>();
      for (const day of days) {
        const insertedDay = tx
          .insert(proposalDays)
          .values({
            proposalId: newProposalId,
            dayNumber: day.dayNumber,
            date: day.date,
            subtitle: day.subtitle,
            highlightLine: day.highlightLine,
            sortOrder: day.sortOrder,
          })
          .returning({ id: proposalDays.id })
          .get();
        dayIdMap.set(day.id, insertedDay.id);
      }
      for (const activity of activities) {
        const dayId = dayIdMap.get(activity.dayId);
        if (!dayId) continue;
        tx.insert(proposalDayActivities).values({ dayId, timeRange: activity.timeRange, description: activity.description, sortOrder: activity.sortOrder }).run();
      }
      for (const paragraph of paragraphs) {
        const dayId = dayIdMap.get(paragraph.dayId);
        if (!dayId) continue;
        tx.insert(proposalDayParagraphs).values({ dayId, body: paragraph.body, sortOrder: paragraph.sortOrder }).run();
      }
      for (const image of images) {
        const dayId = dayIdMap.get(image.dayId);
        if (!dayId) continue;
        tx.insert(proposalDayImages).values({ dayId, url: image.url, sortOrder: image.sortOrder }).run();
      }

      const hotelIdMap = new Map<number, number>();
      for (const booking of hotelBookings) {
        const insertedBooking = tx
          .insert(proposalHotels)
          .values({
            proposalId: newProposalId,
            hotelId: booking.hotelId,
            roomCategory: booking.roomCategory,
            mealPlan: booking.mealPlan,
            nights: booking.nights,
            sortOrder: booking.sortOrder,
          })
          .returning({ id: proposalHotels.id })
          .get();
        hotelIdMap.set(booking.id, insertedBooking.id);
      }

      for (const excursion of excursionRows) {
        tx.insert(proposalExcursions).values({
          proposalId: newProposalId,
          excursionId: excursion.excursionId,
          priceOverride: excursion.priceOverride,
          sortOrder: excursion.sortOrder,
        }).run();
      }

      const listSectionIdMap = new Map<number, number>();
      for (const section of listSections) {
        const insertedSection = tx
          .insert(proposalListSections)
          .values({ proposalId: newProposalId, kind: section.kind, column: section.column, heading: section.heading, sortOrder: section.sortOrder })
          .returning({ id: proposalListSections.id })
          .get();
        listSectionIdMap.set(section.id, insertedSection.id);
      }
      for (const line of listLines) {
        const sectionId = listSectionIdMap.get(line.sectionId);
        if (!sectionId) continue;
        tx.insert(proposalListLines).values({ sectionId, text: line.text, sortOrder: line.sortOrder }).run();
      }

      if (pricing) {
        tx.insert(proposalPricing).values({
          proposalId: newProposalId,
          introText: pricing.introText,
          invoiceTotal: pricing.invoiceTotal,
          commission: pricing.commission,
          amountDue: pricing.amountDue,
          currency: pricing.currency,
          bankAccountId: pricing.bankAccountId,
        }).run();
      }
      for (const payment of paymentSchedule) {
        tx.insert(proposalPaymentSchedule).values({ proposalId: newProposalId, label: payment.label, valueText: payment.valueText, sortOrder: payment.sortOrder }).run();
      }

      for (const section of sectionRows) {
        const refId = section.sectionType === "hotel" && section.refId != null ? hotelIdMap.get(section.refId) ?? null : section.refId;
        tx.insert(proposalSections).values({
          proposalId: newProposalId,
          sectionType: section.sectionType,
          sortOrder: section.sortOrder,
          refId,
          payload: section.payload === null ? null : JSON.parse(JSON.stringify(section.payload)),
        }).run();
      }

      return newProposalId;
    });

    return { ok: true, id: newId };
  } catch {
    return { ok: false, formError: "The proposal could not be duplicated." };
  }
}
