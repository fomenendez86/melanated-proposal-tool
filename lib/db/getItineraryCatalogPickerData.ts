import { asc, eq } from "drizzle-orm";

import { db } from "./client";
import { cities, excursions, hotels } from "./schema";

export interface CatalogHotelOption {
  id: number;
  name: string;
  cityName: string;
  defaultRoomCategory: string;
  defaultMealPlan: string;
}

export interface CatalogExcursionOption {
  id: number;
  title: string;
  cityName: string;
}

export interface ItineraryCatalogPickerData {
  hotels: CatalogHotelOption[];
  excursions: CatalogExcursionOption[];
}

// A flat, unfiltered picker list (no cascading location filters like
// CatalogPanel) — kept intentionally lighter since the itinerary editor's
// hotel/excursion pickers are a secondary surface to the day-by-day editor.
export async function getItineraryCatalogPickerData(): Promise<ItineraryCatalogPickerData> {
  const [hotelRows, excursionRows] = await Promise.all([
    db
      .select({ id: hotels.id, name: hotels.name, cityName: cities.name, defaultRoomCategory: hotels.defaultRoomCategory, defaultMealPlan: hotels.defaultMealPlan })
      .from(hotels)
      .innerJoin(cities, eq(cities.id, hotels.cityId))
      .orderBy(asc(hotels.name)),
    db
      .select({ id: excursions.id, title: excursions.title, cityName: cities.name })
      .from(excursions)
      .innerJoin(cities, eq(cities.id, excursions.cityId))
      .orderBy(asc(excursions.title)),
  ]);

  return { hotels: hotelRows, excursions: excursionRows };
}
