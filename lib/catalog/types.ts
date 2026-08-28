import type {
  ExcursionBookingField,
  ExcursionBookingQuestion,
  ExcursionExtra,
  ExcursionPlace,
  ExcursionPricingCategory,
  ExcursionRate,
  ExcursionStartTime,
} from "@/lib/activity-provider/types";

export interface CatalogLocation {
  cityId: number;
  cityName: string;
  destinationId: number;
  destinationName: string;
  countryId: number;
  countryName: string;
}

export interface CatalogHotelItem extends CatalogLocation {
  id: number;
  name: string;
  description: string;
  defaultRoomCategory: string;
  defaultMealPlan: string;
  previewImageUrl: string | null;
  selected: boolean;
}

export interface CatalogExcursionItem extends CatalogLocation {
  id: number;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  priceUnit: "per_person" | "per_group" | "per_vehicle";
  priceNote: string | null;
  previewImageUrl: string | null;
  selected: boolean;
  provider: {
    productId: string;
    active: boolean;
    syncedAt: string;
    excerpt: string | null;
    durationText: string | null;
    durationMinutes: number | null;
    bookingType: "PASS" | "DATE" | "DATE_AND_TIME" | null;
    capacityType: "FREE_SALE" | "LIMITED" | "ON_REQUEST" | null;
    meetingType: "MEET_ON_LOCATION" | "PICK_UP" | "MEET_ON_LOCATION_OR_PICK_UP" | null;
    minAge: number | null;
    difficultyLevel: string | null;
    privateActivity: boolean;
    pickupAvailable: boolean;
    customPickupAllowed: boolean;
    dropoffAvailable: boolean;
    customDropoffAllowed: boolean;
    bookingCutoffMinutes: number | null;
    requestDeadlineMinutes: number | null;
    requirements: string | null;
    attention: string | null;
    included: string | null;
    excluded: string | null;
    mainContactFields: ExcursionBookingField[];
    passengerFields: ExcursionBookingField[];
    bookingQuestions: ExcursionBookingQuestion[];
    pricingCategories: ExcursionPricingCategory[];
    rates: ExcursionRate[];
    pickupPlaces: ExcursionPlace[];
    dropoffPlaces: ExcursionPlace[];
    startTimes: ExcursionStartTime[];
    extras: ExcursionExtra[];
  } | null;
}

export interface ProposalCatalogData {
  locations: CatalogLocation[];
  hotels: CatalogHotelItem[];
  excursions: CatalogExcursionItem[];
  excursionSync: {
    configured: boolean;
    activeProducts: number;
    lastSyncedAt: string | null;
  };
}

export interface CatalogMutationResult {
  ok: boolean;
  formError?: string;
}

export interface CreateCatalogHotelInput {
  cityId: number;
  name: string;
  description: string;
  defaultRoomCategory: string;
  defaultMealPlan: string;
  imageUrl?: string;
}

export interface CreateCatalogExcursionInput {
  cityId: number;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: "per_person" | "per_group" | "per_vehicle";
  priceNote?: string;
  imageUrl?: string;
}
