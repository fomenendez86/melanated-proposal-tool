import { asc, eq } from "drizzle-orm";

import type { ProposalCatalogData } from "@/lib/catalog/types";

import { db } from "./client";
import {
  cities,
  countries,
  destinations,
  excursionImages,
  excursions,
  hotelImages,
  hotels,
  proposalExcursions,
  proposalHotels,
} from "./schema";

export async function getProposalCatalogData(proposalId: number): Promise<ProposalCatalogData> {
  const [locationRows, hotelRows, excursionRows, hotelImageRows, excursionImageRows, selectedHotels, selectedExcursions] =
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
      db.select({ hotelId: proposalHotels.hotelId }).from(proposalHotels).where(eq(proposalHotels.proposalId, proposalId)),
      db.select({ excursionId: proposalExcursions.excursionId }).from(proposalExcursions).where(eq(proposalExcursions.proposalId, proposalId)),
    ]);

  const selectedHotelIds = new Set(selectedHotels.map((row) => row.hotelId));
  const selectedExcursionIds = new Set(selectedExcursions.map((row) => row.excursionId));

  return {
    locations: locationRows,
    hotels: hotelRows.map((hotel) => ({
      ...hotel,
      previewImageUrl: hotelImageRows.find((image) => image.hotelId === hotel.id)?.url ?? null,
      selected: selectedHotelIds.has(hotel.id),
    })),
    excursions: excursionRows.map((excursion) => ({
      ...excursion,
      previewImageUrl: excursionImageRows.find((image) => image.excursionId === excursion.id)?.url ?? null,
      selected: selectedExcursionIds.has(excursion.id),
    })),
  };
}
