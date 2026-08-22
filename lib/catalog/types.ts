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
  priceUnit: "per_person" | "per_group" | "per_vehicle";
  priceNote: string | null;
  previewImageUrl: string | null;
  selected: boolean;
}

export interface ProposalCatalogData {
  locations: CatalogLocation[];
  hotels: CatalogHotelItem[];
  excursions: CatalogExcursionItem[];
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
