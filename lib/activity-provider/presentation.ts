import type { ExcursionBookingField, ExcursionBookingQuestion } from "./types";

interface ExcursionPresentationDetails {
  durationText?: string | null;
  durationMinutes?: number | null;
  bookingType?: string | null;
  capacityType?: string | null;
  meetingType?: string | null;
  minAge?: number | null;
  difficultyLevel?: string | null;
  privateActivity?: boolean;
  pickupAvailable?: boolean;
  customPickupAllowed?: boolean;
  dropoffAvailable?: boolean;
  mainContactFields?: ExcursionBookingField[];
  passengerFields?: ExcursionBookingField[];
  bookingQuestions?: ExcursionBookingQuestion[];
  pricingCategories?: Array<{ title: string }>;
  rates?: Array<{ title: string }>;
  pickupPlaces?: Array<{ askForRoomNumber: boolean }>;
}

const FIELD_LABELS: Record<string, string> = {
  TITLE: "Title",
  FIRST_NAME: "First name",
  LAST_NAME: "Last name",
  PERSONAL_ID_NUMBER: "Personal ID",
  EMAIL: "Email",
  PHONE_NUMBER: "Phone number",
  NATIONALITY: "Nationality",
  GENDER: "Gender",
  ORGANIZATION: "Organization",
  PASSPORT_ID: "Passport number",
  PASSPORT_EXPIRY: "Passport expiry",
  ADDRESS: "Address",
  DATE_OF_BIRTH: "Date of birth",
  LANGUAGE: "Language",
};

function words(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function customerFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? words(field);
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes || minutes < 1) return null;
  if (minutes % 10_080 === 0) return `${minutes / 10_080} week${minutes === 10_080 ? "" : "s"}`;
  if (minutes % 1_440 === 0) return `${minutes / 1_440} day${minutes === 1_440 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${remainder}m`;
}

export function excursionFeatureLabels(details: ExcursionPresentationDetails | null | undefined): string[] {
  if (!details) return [];
  return [
    details.durationText || formatDuration(details.durationMinutes),
    details.privateActivity ? "Private experience" : null,
    details.bookingType === "PASS" ? "Flexible pass" : details.bookingType === "DATE_AND_TIME" ? "Scheduled departure" : details.bookingType === "DATE" ? "Date based" : null,
    details.capacityType === "ON_REQUEST" ? "Confirmation on request" : null,
    details.pickupAvailable ? (details.meetingType === "MEET_ON_LOCATION_OR_PICK_UP" ? "Meet there or pickup" : "Pickup included/available") : "Meet on location",
    details.dropoffAvailable ? "Drop-off available" : null,
    details.minAge != null ? `Minimum age ${details.minAge}` : null,
    details.difficultyLevel ? `${words(details.difficultyLevel)} difficulty` : null,
  ].filter((item): item is string => Boolean(item));
}

export function bookingRequirementLabels(details: ExcursionPresentationDetails | null | undefined): string[] {
  if (!details) return [];
  const labels: string[] = [];
  if (details.rates?.length) labels.push("Rate selection");
  if (details.pricingCategories?.length) labels.push("Participants by category");
  if (details.bookingType === "DATE" || details.bookingType === "DATE_AND_TIME") labels.push("Travel date");
  if (details.bookingType === "DATE_AND_TIME") labels.push("Departure time");
  if (details.pickupAvailable) {
    labels.push(details.customPickupAllowed ? "Pickup place or custom address" : "Pickup place");
    if (details.pickupPlaces?.some((place) => place.askForRoomNumber)) labels.push("Room number when required");
  }
  if (details.dropoffAvailable) labels.push("Drop-off preference");

  const mainFields = details.mainContactFields ?? [];
  if (mainFields.length > 0) {
    labels.push(`Main contact: ${mainFields.map((field) => `${customerFieldLabel(field.field)}${field.required ? "*" : ""}`).join(", ")}`);
  }
  const passengerFields = details.passengerFields ?? [];
  if (passengerFields.length > 0) {
    labels.push(`Each passenger: ${passengerFields.map((field) => `${customerFieldLabel(field.field)}${field.required ? "*" : ""}`).join(", ")}`);
  }
  for (const question of details.bookingQuestions ?? []) {
    labels.push(`${question.context === "PASSENGER" ? "Each passenger" : question.context === "EXTRA" ? "Extra" : "Booking"}: ${question.label}${question.required ? "*" : ""}`);
  }
  return labels;
}
