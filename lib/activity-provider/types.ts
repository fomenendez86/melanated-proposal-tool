export type ExcursionBookingType = "PASS" | "DATE" | "DATE_AND_TIME";
export type ExcursionCapacityType = "FREE_SALE" | "LIMITED" | "ON_REQUEST";
export type ExcursionMeetingType = "MEET_ON_LOCATION" | "PICK_UP" | "MEET_ON_LOCATION_OR_PICK_UP";

export interface ExcursionBookingField {
  field: string;
  required: boolean;
}

export interface ExcursionBookingQuestion {
  id: string;
  code?: string;
  label: string;
  help?: string;
  placeholder?: string;
  required: boolean;
  dataType: string;
  context: "BOOKING" | "PASSENGER" | "EXTRA";
  selectMultiple: boolean;
  options: Array<{ label: string; value: string }>;
  pricingCategoryIds: string[];
  rateIds: string[];
}

export interface ExcursionPricingCategory {
  id: string;
  title: string;
  ticketCategory?: string;
  minAge?: number;
  maxAge?: number;
  groupSize?: number;
  defaultCategory: boolean;
}

export interface ExcursionRate {
  id: string;
  title: string;
  description?: string;
  pricedPerPerson: boolean;
  minPerBooking?: number;
  maxPerBooking?: number;
  pickupSelectionType?: string;
  dropoffSelectionType?: string;
  pricingCategoryIds: string[];
}

export interface ExcursionPlace {
  id: string;
  title: string;
  type?: string;
  address?: string;
  askForRoomNumber: boolean;
}

export interface ExcursionStartTime {
  id: string;
  label: string;
  hour?: number;
  minute?: number;
}

export interface ExcursionExtra {
  id: string;
  title: string;
  information?: string;
  included: boolean;
  free: boolean;
  pricingType?: string;
  price?: number;
}

export interface NormalizedProviderExcursion {
  providerProductId: string;
  providerProductCode?: string;
  slug?: string;
  title: string;
  description: string;
  excerpt?: string;
  published: boolean;
  providerModifiedAt?: string;
  cityName?: string;
  countryName?: string;
  countryCode?: string;
  basePrice: number;
  currency: string;
  priceUnit: "per_person" | "per_group" | "per_vehicle";
  priceNote?: string;
  durationText?: string;
  durationMinutes?: number;
  bookingType?: ExcursionBookingType;
  capacityType?: ExcursionCapacityType;
  meetingType?: ExcursionMeetingType;
  minAge?: number;
  difficultyLevel?: string;
  privateActivity: boolean;
  pickupAvailable: boolean;
  customPickupAllowed: boolean;
  dropoffAvailable: boolean;
  customDropoffAllowed: boolean;
  bookingCutoffMinutes?: number;
  requestDeadlineMinutes?: number;
  requirements?: string;
  attention?: string;
  included?: string;
  excluded?: string;
  mainContactFields: ExcursionBookingField[];
  passengerFields: ExcursionBookingField[];
  bookingQuestions: ExcursionBookingQuestion[];
  pricingCategories: ExcursionPricingCategory[];
  rates: ExcursionRate[];
  pickupPlaces: ExcursionPlace[];
  dropoffPlaces: ExcursionPlace[];
  startTimes: ExcursionStartTime[];
  extras: ExcursionExtra[];
  images: Array<{ providerPhotoId?: string; url: string; altText?: string }>;
}

export interface ActivityProviderSyncResult {
  ok: boolean;
  created: number;
  updated: number;
  matched: number;
  deactivated: number;
  failed: number;
  total: number;
  syncedAt?: string;
  formError?: string;
}
