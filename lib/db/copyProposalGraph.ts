import { randomUUID } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";

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
  proposalPricingItems,
  proposalSections,
} from "./schema";
import type { Transaction } from "./client";

// Deep-copies every proposal-scoped child row (days/activities/paragraphs/
// images, hotel bookings, excursions, list sections/lines, pricing, payment
// schedule, sections) from sourceProposalId into an ALREADY-EXISTING
// targetProposalId row. Every child gets a fresh id — editing the copy never
// mutates the source. Shared catalog rows (hotels, excursions, cities) stay
// referenced, not copied. Callers own the `proposals` row itself (insert or
// reuse) and never-copied tables (revisions/shares/events) — this helper only
// handles the child graph, so it can be reused by duplicate, save-as-template,
// create-from-template, and update-template-from-proposal alike.
export function copyProposalGraphInto(
  tx: Transaction,
  sourceProposalId: number,
  targetProposalId: number,
  overrides?: { leadClientId?: number; skipClients?: boolean }
): void {
  if (!overrides?.skipClients) {
    const clientRows = tx.select().from(proposalClients).where(eq(proposalClients.proposalId, sourceProposalId)).all();
    for (const row of clientRows) {
      const clientId = row.role === "lead" && overrides?.leadClientId ? overrides.leadClientId : row.clientId;
      tx.insert(proposalClients).values({ proposalId: targetProposalId, clientId, role: row.role }).run();
    }
  }

  const days = tx
    .select()
    .from(proposalDays)
    .where(eq(proposalDays.proposalId, sourceProposalId))
    .orderBy(asc(proposalDays.sortOrder))
    .all();
  const dayIds = days.map((day) => day.id);
  const activities = dayIds.length
    ? tx.select().from(proposalDayActivities).where(inArray(proposalDayActivities.dayId, dayIds)).all()
    : [];
  const paragraphs = dayIds.length
    ? tx.select().from(proposalDayParagraphs).where(inArray(proposalDayParagraphs.dayId, dayIds)).all()
    : [];
  const images = dayIds.length
    ? tx.select().from(proposalDayImages).where(inArray(proposalDayImages.dayId, dayIds)).all()
    : [];

  const dayIdMap = new Map<number, number>();
  for (const day of days) {
    const insertedDay = tx
      .insert(proposalDays)
      .values({
        proposalId: targetProposalId,
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

  const hotelBookings = tx.select().from(proposalHotels).where(eq(proposalHotels.proposalId, sourceProposalId)).all();
  const hotelIdMap = new Map<number, number>();
  for (const booking of hotelBookings) {
    const insertedBooking = tx
      .insert(proposalHotels)
      .values({
        proposalId: targetProposalId,
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

  const excursionRows = tx.select().from(proposalExcursions).where(eq(proposalExcursions.proposalId, sourceProposalId)).all();
  for (const excursion of excursionRows) {
    tx.insert(proposalExcursions).values({
      proposalId: targetProposalId,
      excursionId: excursion.excursionId,
      priceOverride: excursion.priceOverride,
      sortOrder: excursion.sortOrder,
    }).run();
  }

  const listSections = tx.select().from(proposalListSections).where(eq(proposalListSections.proposalId, sourceProposalId)).all();
  const listSectionIds = listSections.map((section) => section.id);
  const listLines = listSectionIds.length
    ? tx.select().from(proposalListLines).where(inArray(proposalListLines.sectionId, listSectionIds)).all()
    : [];
  const listSectionIdMap = new Map<number, number>();
  for (const section of listSections) {
    const insertedSection = tx
      .insert(proposalListSections)
      .values({ proposalId: targetProposalId, kind: section.kind, column: section.column, heading: section.heading, sortOrder: section.sortOrder })
      .returning({ id: proposalListSections.id })
      .get();
    listSectionIdMap.set(section.id, insertedSection.id);
  }
  for (const line of listLines) {
    const sectionId = listSectionIdMap.get(line.sectionId);
    if (!sectionId) continue;
    tx.insert(proposalListLines).values({ sectionId, text: line.text, sortOrder: line.sortOrder }).run();
  }

  const [pricing] = tx.select().from(proposalPricing).where(eq(proposalPricing.proposalId, sourceProposalId)).all();
  if (pricing) {
    tx.insert(proposalPricing).values({
      proposalId: targetProposalId,
      introText: pricing.introText,
      invoiceTotal: pricing.invoiceTotal,
      commission: pricing.commission,
      amountDue: pricing.amountDue,
      currency: pricing.currency,
      bankAccountId: pricing.bankAccountId,
    }).run();
  }
  const pricingItems = tx.select().from(proposalPricingItems).where(eq(proposalPricingItems.proposalId, sourceProposalId)).all();
  for (const item of pricingItems) {
    tx.insert(proposalPricingItems).values({
      publicId: randomUUID(), proposalId: targetProposalId, description: item.description,
      quantityMilli: item.quantityMilli, unitPriceMinor: item.unitPriceMinor, currency: item.currency,
      unit: item.unit, taxRateBps: item.taxRateBps, discountType: item.discountType,
      discountValue: item.discountValue, optional: item.optional, selectedByDefault: item.selectedByDefault,
      quantityEditable: item.quantityEditable, sortOrder: item.sortOrder,
    }).run();
  }
  const paymentSchedule = tx.select().from(proposalPaymentSchedule).where(eq(proposalPaymentSchedule.proposalId, sourceProposalId)).all();
  for (const payment of paymentSchedule) {
    tx.insert(proposalPaymentSchedule).values({ proposalId: targetProposalId, label: payment.label, valueText: payment.valueText, amountType: payment.amountType, amountMinor: payment.amountMinor, percentageBps: payment.percentageBps, sortOrder: payment.sortOrder }).run();
  }

  const sectionRows = tx
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.proposalId, sourceProposalId))
    .orderBy(asc(proposalSections.sortOrder))
    .all();
  for (const section of sectionRows) {
    const refId = section.sectionType === "hotel" && section.refId != null ? hotelIdMap.get(section.refId) ?? null : section.refId;
    tx.insert(proposalSections).values({
      proposalId: targetProposalId,
      sectionType: section.sectionType,
      sortOrder: section.sortOrder,
      refId,
      payload: section.payload === null ? null : JSON.parse(JSON.stringify(section.payload)),
    }).run();
  }
}
