import { asc, eq } from "drizzle-orm";

import type { ProposalCatalogData } from "@/lib/catalog/types";

import { db } from "./client";
import {
  cities,
  countries,
  destinations,
  excursionImages,
  excursionProviderData,
  excursions,
  hotelImages,
  hotels,
  proposalExcursions,
  proposalHotels,
} from "./schema";

export async function getProposalCatalogData(proposalId: number): Promise<ProposalCatalogData> {
  const [locationRows, hotelRows, excursionRows, hotelImageRows, excursionImageRows, providerRows, selectedHotels, selectedExcursions] =
    await Promise.all([
      db
        .select({
          cityId: cities.id,
          cityName: cities.name,
          destinationId: destinations.id,
          destinationName: destinations.name,
          countryId: countries.id,
          countryName: countries.name,
        })
        .from(cities)
        .innerJoin(destinations, eq(destinations.id, cities.destinationId))
        .innerJoin(countries, eq(countries.id, destinations.countryId))
        .orderBy(asc(countries.name), asc(destinations.name), asc(cities.name)),
      db
        .select({
          id: hotels.id,
          name: hotels.name,
          description: hotels.description,
          defaultRoomCategory: hotels.defaultRoomCategory,
          defaultMealPlan: hotels.defaultMealPlan,
          cityId: cities.id,
          cityName: cities.name,
          destinationId: destinations.id,
          destinationName: destinations.name,
          countryId: countries.id,
          countryName: countries.name,
        })
        .from(hotels)
        .innerJoin(cities, eq(cities.id, hotels.cityId))
        .innerJoin(destinations, eq(destinations.id, cities.destinationId))
        .innerJoin(countries, eq(countries.id, destinations.countryId))
        .orderBy(asc(hotels.name)),
      db
        .select({
          id: excursions.id,
          title: excursions.title,
          description: excursions.description,
          basePrice: excursions.basePrice,
          currency: excursions.currency,
          priceUnit: excursions.priceUnit,
          priceNote: excursions.priceNote,
          cityId: cities.id,
          cityName: cities.name,
          destinationId: destinations.id,
          destinationName: destinations.name,
          countryId: countries.id,
          countryName: countries.name,
        })
        .from(excursions)
        .innerJoin(cities, eq(cities.id, excursions.cityId))
        .innerJoin(destinations, eq(destinations.id, cities.destinationId))
        .innerJoin(countries, eq(countries.id, destinations.countryId))
        .orderBy(asc(excursions.title)),
      db.select().from(hotelImages).orderBy(asc(hotelImages.sortOrder)),
      db.select().from(excursionImages).orderBy(asc(excursionImages.sortOrder)),
      db.select().from(excursionProviderData),
      db.select({ hotelId: proposalHotels.hotelId }).from(proposalHotels).where(eq(proposalHotels.proposalId, proposalId)),
      db.select({ excursionId: proposalExcursions.excursionId }).from(proposalExcursions).where(eq(proposalExcursions.proposalId, proposalId)),
    ]);

  const selectedHotelIds = new Set(selectedHotels.map((row) => row.hotelId));
  const selectedExcursionIds = new Set(selectedExcursions.map((row) => row.excursionId));
  const providerByExcursionId = new Map(providerRows.map((row) => [row.excursionId, row]));
  const activeProviderRows = providerRows.filter((row) => row.active);
  const lastSyncedAt = providerRows.reduce<Date | null>((latest, row) => (
    !latest || row.syncedAt > latest ? row.syncedAt : latest
  ), null);

  return {
    locations: locationRows,
    hotels: hotelRows.map((hotel) => ({
      ...hotel,
      previewImageUrl: hotelImageRows.find((image) => image.hotelId === hotel.id)?.url ?? null,
      selected: selectedHotelIds.has(hotel.id),
    })),
    excursions: excursionRows.flatMap((excursion) => {
      const provider = providerByExcursionId.get(excursion.id);
      if (provider && !provider.active) return [];
      return [{
        ...excursion,
        previewImageUrl: excursionImageRows.find((image) => image.excursionId === excursion.id)?.url ?? null,
        selected: selectedExcursionIds.has(excursion.id),
        provider: provider ? {
          productId: provider.providerProductId,
          active: provider.active,
          syncedAt: provider.syncedAt.toISOString(),
          excerpt: provider.excerpt,
          durationText: provider.durationText,
          durationMinutes: provider.durationMinutes,
          bookingType: provider.bookingType,
          capacityType: provider.capacityType,
          meetingType: provider.meetingType,
          minAge: provider.minAge,
          difficultyLevel: provider.difficultyLevel,
          privateActivity: provider.privateActivity,
          pickupAvailable: provider.pickupAvailable,
          customPickupAllowed: provider.customPickupAllowed,
          dropoffAvailable: provider.dropoffAvailable,
          customDropoffAllowed: provider.customDropoffAllowed,
          bookingCutoffMinutes: provider.bookingCutoffMinutes,
          requestDeadlineMinutes: provider.requestDeadlineMinutes,
          requirements: provider.requirements,
          attention: provider.attention,
          included: provider.included,
          excluded: provider.excluded,
          mainContactFields: provider.mainContactFields,
          passengerFields: provider.passengerFields,
          bookingQuestions: provider.bookingQuestions,
          pricingCategories: provider.pricingCategories,
          rates: provider.rates,
          pickupPlaces: provider.pickupPlaces,
          dropoffPlaces: provider.dropoffPlaces,
          startTimes: provider.startTimes,
          extras: provider.extras,
        } : null,
      }];
    }),
    excursionSync: {
      configured: [
        "ACTIVITY_PROVIDER_BASE_URL",
        "ACTIVITY_PROVIDER_ACCESS_KEY",
        "ACTIVITY_PROVIDER_SECRET_KEY",
        "ACTIVITY_PROVIDER_HEADER_PREFIX",
      ].every((key) => Boolean(process.env[key]?.trim())),
      activeProducts: activeProviderRows.length,
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
    },
  };
}
