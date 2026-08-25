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

export interface ItineraryDayData {
  id: number;
  dayNumber: number;
  date: string | null;
  subtitle: string | null;
  highlightLine: string | null;
  activities: { id: number; timeRange: string | null; description: string }[];
  paragraphs: { id: number; body: string }[];
  images: { id: number; url: string }[];
}

export interface ItineraryTierData {
  id: number;
  name: string;
  description: string | null;
  priceMinor: number | null;
  currency: string | null;
}

export interface ItineraryHotelData {
  id: number;
  tierId: number | null;
  hotelId: number;
  roomCategory: string;
  mealPlan: string;
  nights: number;
}

export interface ItineraryExcursionData {
  id: number;
  tierId: number | null;
  excursionId: number;
  priceOverride: number | null;
}

export interface ItineraryFlightData {
  id: number;
  tierId: number | null;
  carrier: string | null;
  flightNumber: string | null;
  originAirport: string | null;
  destinationAirport: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  cabinClass: string | null;
  costMinor: number | null;
  currency: string | null;
  notes: string | null;
}

export interface ItineraryTransportData {
  id: number;
  tierId: number | null;
  mode: string | null;
  description: string | null;
  vehicleType: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  scheduledAt: string | null;
  costMinor: number | null;
  currency: string | null;
}

export interface ItineraryData {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  destinationLabel: string | null;
  archived: boolean;
  tiers: ItineraryTierData[];
  days: ItineraryDayData[];
  hotels: ItineraryHotelData[];
  excursions: ItineraryExcursionData[];
  flights: ItineraryFlightData[];
  transport: ItineraryTransportData[];
}

export async function getItineraryData(itineraryId: number): Promise<ItineraryData | null> {
  const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, itineraryId));
  if (!itinerary) return null;

  const tiers = await db.select().from(itineraryTiers).where(eq(itineraryTiers.itineraryId, itineraryId)).orderBy(asc(itineraryTiers.sortOrder));
  const days = await db.select().from(itineraryDays).where(eq(itineraryDays.itineraryId, itineraryId)).orderBy(asc(itineraryDays.sortOrder));

  const dayData: ItineraryDayData[] = [];
  for (const day of days) {
    const activities = await db
      .select()
      .from(itineraryDayActivities)
      .where(eq(itineraryDayActivities.dayId, day.id))
      .orderBy(asc(itineraryDayActivities.sortOrder));
    const paragraphs = await db
      .select()
      .from(itineraryDayParagraphs)
      .where(eq(itineraryDayParagraphs.dayId, day.id))
      .orderBy(asc(itineraryDayParagraphs.sortOrder));
    const images = await db
      .select()
      .from(itineraryDayImages)
      .where(eq(itineraryDayImages.dayId, day.id))
      .orderBy(asc(itineraryDayImages.sortOrder));
    dayData.push({
      id: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
      subtitle: day.subtitle,
      highlightLine: day.highlightLine,
      activities: activities.map((a) => ({ id: a.id, timeRange: a.timeRange, description: a.description })),
      paragraphs: paragraphs.map((p) => ({ id: p.id, body: p.body })),
      images: images.map((i) => ({ id: i.id, url: i.url })),
    });
  }

  const hotels = await db.select().from(itineraryHotels).where(eq(itineraryHotels.itineraryId, itineraryId)).orderBy(asc(itineraryHotels.sortOrder));
  const excursions = await db
    .select()
    .from(itineraryExcursions)
    .where(eq(itineraryExcursions.itineraryId, itineraryId))
    .orderBy(asc(itineraryExcursions.sortOrder));
  const flights = await db.select().from(itineraryFlights).where(eq(itineraryFlights.itineraryId, itineraryId)).orderBy(asc(itineraryFlights.sortOrder));
  const transport = await db
    .select()
    .from(itineraryTransport)
    .where(eq(itineraryTransport.itineraryId, itineraryId))
    .orderBy(asc(itineraryTransport.sortOrder));

  return {
    id: itinerary.id,
    name: itinerary.name,
    description: itinerary.description,
    thumbnailUrl: itinerary.thumbnailUrl,
    destinationLabel: itinerary.destinationLabel,
    archived: itinerary.archivedAt !== null,
    tiers: tiers.map((t) => ({ id: t.id, name: t.name, description: t.description, priceMinor: t.priceMinor, currency: t.currency })),
    days: dayData,
    hotels: hotels.map((h) => ({ id: h.id, tierId: h.tierId, hotelId: h.hotelId, roomCategory: h.roomCategory, mealPlan: h.mealPlan, nights: h.nights })),
    excursions: excursions.map((e) => ({ id: e.id, tierId: e.tierId, excursionId: e.excursionId, priceOverride: e.priceOverride })),
    flights: flights.map((f) => ({
      id: f.id,
      tierId: f.tierId,
      carrier: f.carrier,
      flightNumber: f.flightNumber,
      originAirport: f.originAirport,
      destinationAirport: f.destinationAirport,
      departureAt: f.departureAt ? f.departureAt.toISOString() : null,
      arrivalAt: f.arrivalAt ? f.arrivalAt.toISOString() : null,
      cabinClass: f.cabinClass,
      costMinor: f.costMinor,
      currency: f.currency,
      notes: f.notes,
    })),
    transport: transport.map((t) => ({
      id: t.id,
      tierId: t.tierId,
      mode: t.mode,
      description: t.description,
      vehicleType: t.vehicleType,
      pickupLocation: t.pickupLocation,
      dropoffLocation: t.dropoffLocation,
      scheduledAt: t.scheduledAt ? t.scheduledAt.toISOString() : null,
      costMinor: t.costMinor,
      currency: t.currency,
    })),
  };
}
