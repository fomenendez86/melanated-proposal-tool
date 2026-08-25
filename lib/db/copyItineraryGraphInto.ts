import { asc, eq } from "drizzle-orm";

import {
  itineraryDayActivities,
  itineraryDayImages,
  itineraryDayParagraphs,
  itineraryDays,
  itineraryExcursions,
  itineraryFlights,
  itineraryHotels,
  itineraryTransport,
  proposalDayActivities,
  proposalDayImages,
  proposalDayParagraphs,
  proposalDays,
  proposalExcursions,
  proposalFlights,
  proposalHotels,
  proposalSections,
  proposalTransport,
} from "./schema";
import type { Transaction } from "./client";

// Deep-copies the tier-filtered graph of an itinerary (days always, hotels/
// excursions/flights/transport where tierId is null [shared] or matches the
// chosen tierId) into an ALREADY-EXISTING targetProposalId row. Days have no
// tier concept — they're the single source of truth shared by every tier, so
// they always copy in full. Does not touch proposalPricing — the new
// proposal starts with no pricing, same as the "blank" origin in
// createProposal(). Does not create proposalSections for days/hotels/
// excursions either (same "blank" precedent — the user inserts those pages
// manually via the composition UI once real data exists to point at).
// Flights/transport are the one exception: since neither has a manual
// "insert a page" UI (no catalog/picker exists for them, unlike hotels),
// this is the only way a flightDetails/transportDetails page can ever
// appear — so this function creates their proposalSections row itself,
// once, only when there's at least one leg to show.
export function copyItineraryGraphInto(
  tx: Transaction,
  itineraryId: number,
  tierId: number | null,
  targetProposalId: number
): void {
  const appliesToTier = <T extends { tierId: number | null }>(row: T) => row.tierId === null || row.tierId === tierId;

  const days = tx
    .select()
    .from(itineraryDays)
    .where(eq(itineraryDays.itineraryId, itineraryId))
    .orderBy(asc(itineraryDays.sortOrder))
    .all();
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
  for (const day of days) {
    const newDayId = dayIdMap.get(day.id);
    if (!newDayId) continue;
    const activities = tx.select().from(itineraryDayActivities).where(eq(itineraryDayActivities.dayId, day.id)).all();
    for (const activity of activities) {
      tx.insert(proposalDayActivities)
        .values({ dayId: newDayId, timeRange: activity.timeRange, description: activity.description, sortOrder: activity.sortOrder })
        .run();
    }
    const paragraphs = tx.select().from(itineraryDayParagraphs).where(eq(itineraryDayParagraphs.dayId, day.id)).all();
    for (const paragraph of paragraphs) {
      tx.insert(proposalDayParagraphs).values({ dayId: newDayId, body: paragraph.body, sortOrder: paragraph.sortOrder }).run();
    }
    const images = tx.select().from(itineraryDayImages).where(eq(itineraryDayImages.dayId, day.id)).all();
    for (const image of images) {
      tx.insert(proposalDayImages).values({ dayId: newDayId, url: image.url, sortOrder: image.sortOrder }).run();
    }
  }

  const hotelRows = tx.select().from(itineraryHotels).where(eq(itineraryHotels.itineraryId, itineraryId)).orderBy(asc(itineraryHotels.sortOrder)).all().filter(appliesToTier);
  for (const hotel of hotelRows) {
    tx.insert(proposalHotels)
      .values({
        proposalId: targetProposalId,
        hotelId: hotel.hotelId,
        roomCategory: hotel.roomCategory,
        mealPlan: hotel.mealPlan,
        nights: hotel.nights,
        sortOrder: hotel.sortOrder,
      })
      .run();
  }

  const excursionRows = tx.select().from(itineraryExcursions).where(eq(itineraryExcursions.itineraryId, itineraryId)).orderBy(asc(itineraryExcursions.sortOrder)).all().filter(appliesToTier);
  for (const excursion of excursionRows) {
    tx.insert(proposalExcursions)
      .values({
        proposalId: targetProposalId,
        excursionId: excursion.excursionId,
        priceOverride: excursion.priceOverride,
        sortOrder: excursion.sortOrder,
      })
      .run();
  }

  const flightRows = tx
    .select()
    .from(itineraryFlights)
    .where(eq(itineraryFlights.itineraryId, itineraryId))
    .orderBy(asc(itineraryFlights.sortOrder))
    .all()
    .filter(appliesToTier);
  if (flightRows.length) {
    flightRows.forEach((flight, index) => {
      tx.insert(proposalFlights)
        .values({
          proposalId: targetProposalId,
          carrier: flight.carrier,
          flightNumber: flight.flightNumber,
          originAirport: flight.originAirport,
          destinationAirport: flight.destinationAirport,
          departureAt: flight.departureAt,
          arrivalAt: flight.arrivalAt,
          cabinClass: flight.cabinClass,
          costMinor: flight.costMinor,
          currency: flight.currency,
          notes: flight.notes,
          sortOrder: index,
        })
        .run();
    });
    tx.insert(proposalSections).values({ proposalId: targetProposalId, sectionType: "flightDetails", sortOrder: 10, refId: null }).run();
  }

  const transportRows = tx
    .select()
    .from(itineraryTransport)
    .where(eq(itineraryTransport.itineraryId, itineraryId))
    .orderBy(asc(itineraryTransport.sortOrder))
    .all()
    .filter(appliesToTier);
  if (transportRows.length) {
    transportRows.forEach((transport, index) => {
      tx.insert(proposalTransport)
        .values({
          proposalId: targetProposalId,
          mode: transport.mode,
          description: transport.description,
          vehicleType: transport.vehicleType,
          pickupLocation: transport.pickupLocation,
          dropoffLocation: transport.dropoffLocation,
          scheduledAt: transport.scheduledAt,
          costMinor: transport.costMinor,
          currency: transport.currency,
          sortOrder: index,
        })
        .run();
    });
    tx.insert(proposalSections).values({ proposalId: targetProposalId, sectionType: "transportDetails", sortOrder: 20, refId: null }).run();
  }
}
