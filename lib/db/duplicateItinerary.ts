import { asc, eq } from "drizzle-orm";

import { db } from "./client";
import {
  itineraries,
  itineraryDayActivities,
  itineraryDayImages,
  itineraryDayParagraphs,
  itineraryDays,
  itineraryExcursions,
  itineraryFlights,
  itineraryHotels,
  itineraryTiers,
  itineraryTransport,
} from "./schema";

export interface DuplicateItineraryResult {
  ok: boolean;
  id?: number;
  formError?: string;
}

// Full-graph deep copy, same shape as duplicateProposal — every child row
// (tiers, days + activities/paragraphs/images, hotels/excursions/flights/
// transport) gets a fresh id, with tierId/dayId remapped through local maps
// so editing the duplicate never mutates the source.
export async function duplicateItinerary(sourceItineraryId: number): Promise<DuplicateItineraryResult> {
  const [source] = await db.select().from(itineraries).where(eq(itineraries.id, sourceItineraryId));
  if (!source) return { ok: false, formError: "Itinerary not found." };

  try {
    const newId = db.transaction((tx) => {
      const inserted = tx
        .insert(itineraries)
        .values({
          name: `${source.name} (copy)`,
          description: source.description,
          thumbnailUrl: source.thumbnailUrl,
          destinationLabel: source.destinationLabel,
        })
        .returning({ id: itineraries.id })
        .get();
      const newItineraryId = inserted.id;

      const tiers = tx.select().from(itineraryTiers).where(eq(itineraryTiers.itineraryId, sourceItineraryId)).orderBy(asc(itineraryTiers.sortOrder)).all();
      const tierIdMap = new Map<number, number>();
      for (const tier of tiers) {
        const insertedTier = tx
          .insert(itineraryTiers)
          .values({ itineraryId: newItineraryId, name: tier.name, description: tier.description, priceMinor: tier.priceMinor, currency: tier.currency, sortOrder: tier.sortOrder })
          .returning({ id: itineraryTiers.id })
          .get();
        tierIdMap.set(tier.id, insertedTier.id);
      }
      const remapTier = (tierId: number | null) => (tierId === null ? null : tierIdMap.get(tierId) ?? null);

      const days = tx.select().from(itineraryDays).where(eq(itineraryDays.itineraryId, sourceItineraryId)).orderBy(asc(itineraryDays.sortOrder)).all();
      const dayIdMap = new Map<number, number>();
      for (const day of days) {
        const insertedDay = tx
          .insert(itineraryDays)
          .values({ itineraryId: newItineraryId, dayNumber: day.dayNumber, date: day.date, subtitle: day.subtitle, highlightLine: day.highlightLine, sortOrder: day.sortOrder })
          .returning({ id: itineraryDays.id })
          .get();
        dayIdMap.set(day.id, insertedDay.id);
      }
      for (const day of days) {
        const newDayId = dayIdMap.get(day.id);
        if (!newDayId) continue;
        for (const activity of tx.select().from(itineraryDayActivities).where(eq(itineraryDayActivities.dayId, day.id)).all()) {
          tx.insert(itineraryDayActivities).values({ dayId: newDayId, timeRange: activity.timeRange, description: activity.description, sortOrder: activity.sortOrder }).run();
        }
        for (const paragraph of tx.select().from(itineraryDayParagraphs).where(eq(itineraryDayParagraphs.dayId, day.id)).all()) {
          tx.insert(itineraryDayParagraphs).values({ dayId: newDayId, body: paragraph.body, sortOrder: paragraph.sortOrder }).run();
        }
        for (const image of tx.select().from(itineraryDayImages).where(eq(itineraryDayImages.dayId, day.id)).all()) {
          tx.insert(itineraryDayImages).values({ dayId: newDayId, url: image.url, sortOrder: image.sortOrder }).run();
        }
      }

      for (const hotel of tx.select().from(itineraryHotels).where(eq(itineraryHotels.itineraryId, sourceItineraryId)).all()) {
        tx.insert(itineraryHotels).values({ itineraryId: newItineraryId, tierId: remapTier(hotel.tierId), hotelId: hotel.hotelId, roomCategory: hotel.roomCategory, mealPlan: hotel.mealPlan, nights: hotel.nights, sortOrder: hotel.sortOrder }).run();
      }
      for (const excursion of tx.select().from(itineraryExcursions).where(eq(itineraryExcursions.itineraryId, sourceItineraryId)).all()) {
        tx.insert(itineraryExcursions).values({ itineraryId: newItineraryId, tierId: remapTier(excursion.tierId), excursionId: excursion.excursionId, priceOverride: excursion.priceOverride, sortOrder: excursion.sortOrder }).run();
      }
      for (const flight of tx.select().from(itineraryFlights).where(eq(itineraryFlights.itineraryId, sourceItineraryId)).all()) {
        tx.insert(itineraryFlights).values({
          itineraryId: newItineraryId, tierId: remapTier(flight.tierId), carrier: flight.carrier, flightNumber: flight.flightNumber,
          originAirport: flight.originAirport, destinationAirport: flight.destinationAirport, departureAt: flight.departureAt, arrivalAt: flight.arrivalAt,
          cabinClass: flight.cabinClass, costMinor: flight.costMinor, currency: flight.currency, notes: flight.notes, sortOrder: flight.sortOrder,
        }).run();
      }
      for (const transport of tx.select().from(itineraryTransport).where(eq(itineraryTransport.itineraryId, sourceItineraryId)).all()) {
        tx.insert(itineraryTransport).values({
          itineraryId: newItineraryId, tierId: remapTier(transport.tierId), mode: transport.mode, description: transport.description,
          vehicleType: transport.vehicleType, pickupLocation: transport.pickupLocation, dropoffLocation: transport.dropoffLocation,
          scheduledAt: transport.scheduledAt, costMinor: transport.costMinor, currency: transport.currency, sortOrder: transport.sortOrder,
        }).run();
      }

      return newItineraryId;
    });

    return { ok: true, id: newId };
  } catch {
    return { ok: false, formError: "The itinerary could not be duplicated." };
  }
}
