import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { DocumentDesignDescriptor } from "@/lib/designs/types";
import type { ProposalData } from "@/lib/types";
import type {
  ExcursionBookingField,
  ExcursionBookingQuestion,
  ExcursionExtra,
  ExcursionPlace,
  ExcursionPricingCategory,
  ExcursionRate,
  ExcursionStartTime,
} from "@/lib/activity-provider/types";

const id = { id: integer("id").primaryKey({ autoIncrement: true }) };

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
};

// ---------------------------------------------------------------------------
// Company — single-row business info, referenced by every proposal at render
// time instead of being hardcoded per proposal.
// ---------------------------------------------------------------------------

export const company = sqliteTable("company", {
  ...id,
  legalName: text("legal_name").notNull(),
  displayName: text("display_name").notNull(),
  foundedDate: text("founded_date"),
  logoUrl: text("logo_url"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  aboutPhotoUrl: text("about_photo_url"),
});

export const companyBankAccounts = sqliteTable("company_bank_accounts", {
  ...id,
  companyId: integer("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  beneficiaryName: text("beneficiary_name").notNull(),
  swiftCode: text("swift_code"),
  routingNumber: text("routing_number"),
  accountNumber: text("account_number").notNull(),
  currency: text("currency").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
});

export const companyFounders = sqliteTable("company_founders", {
  ...id,
  companyId: integer("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const companyAboutParagraphs = sqliteTable("company_about_paragraphs", {
  ...id,
  companyId: integer("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Catalog — reusable reference data, independent of any single proposal.
// ---------------------------------------------------------------------------

export const countries = sqliteTable("countries", {
  ...id,
  name: text("name").notNull(),
  code: text("code").notNull(),
});

export const destinations = sqliteTable("destinations", {
  ...id,
  countryId: integer("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
});

export const cities = sqliteTable("cities", {
  ...id,
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinations.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
});

export const hotels = sqliteTable("hotels", {
  ...id,
  cityId: integer("city_id")
    .notNull()
    .references(() => cities.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  defaultRoomCategory: text("default_room_category").notNull(),
  defaultMealPlan: text("default_meal_plan").notNull(),
});

export const hotelImages = sqliteTable(
  "hotel_images",
  {
    ...id,
    hotelId: integer("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    slot: text("slot").notNull().$type<"topRight" | "bottomLeftTop" | "bottomLeftBottom" | "gallery">(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    check(
      "hotel_images_slot_check",
      sql`${table.slot} in ('topRight', 'bottomLeftTop', 'bottomLeftBottom', 'gallery')`
    ),
  ]
);

export const excursions = sqliteTable(
  "excursions",
  {
    ...id,
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    basePrice: real("base_price").notNull(),
    currency: text("currency").notNull().default("USD"),
    priceUnit: text("price_unit").notNull().$type<"per_person" | "per_group" | "per_vehicle">(),
    priceNote: text("price_note"),
  },
  (table) => [
    check(
      "excursions_price_unit_check",
      sql`${table.priceUnit} in ('per_person', 'per_group', 'per_vehicle')`
    ),
  ]
);

export const excursionImages = sqliteTable("excursion_images", {
  ...id,
  excursionId: integer("excursion_id")
    .notNull()
    .references(() => excursions.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text"),
  providerPhotoId: text("provider_photo_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const excursionProviderData = sqliteTable(
  "excursion_provider_data",
  {
    ...id,
    excursionId: integer("excursion_id")
      .notNull()
      .references(() => excursions.id, { onDelete: "cascade" }),
    providerProductId: text("provider_product_id").notNull(),
    providerProductCode: text("provider_product_code"),
    slug: text("slug"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    providerModifiedAt: text("provider_modified_at"),
    syncedAt: integer("synced_at", { mode: "timestamp" }).notNull(),
    excerpt: text("excerpt"),
    durationText: text("duration_text"),
    durationMinutes: integer("duration_minutes"),
    bookingType: text("booking_type").$type<"PASS" | "DATE" | "DATE_AND_TIME">(),
    capacityType: text("capacity_type").$type<"FREE_SALE" | "LIMITED" | "ON_REQUEST">(),
    meetingType: text("meeting_type").$type<"MEET_ON_LOCATION" | "PICK_UP" | "MEET_ON_LOCATION_OR_PICK_UP">(),
    minAge: integer("min_age"),
    difficultyLevel: text("difficulty_level"),
    privateActivity: integer("private_activity", { mode: "boolean" }).notNull().default(false),
    pickupAvailable: integer("pickup_available", { mode: "boolean" }).notNull().default(false),
    customPickupAllowed: integer("custom_pickup_allowed", { mode: "boolean" }).notNull().default(false),
    dropoffAvailable: integer("dropoff_available", { mode: "boolean" }).notNull().default(false),
    customDropoffAllowed: integer("custom_dropoff_allowed", { mode: "boolean" }).notNull().default(false),
    bookingCutoffMinutes: integer("booking_cutoff_minutes"),
    requestDeadlineMinutes: integer("request_deadline_minutes"),
    requirements: text("requirements"),
    attention: text("attention"),
    included: text("included"),
    excluded: text("excluded"),
    mainContactFields: text("main_contact_fields", { mode: "json" }).notNull().$type<ExcursionBookingField[]>(),
    passengerFields: text("passenger_fields", { mode: "json" }).notNull().$type<ExcursionBookingField[]>(),
    bookingQuestions: text("booking_questions", { mode: "json" }).notNull().$type<ExcursionBookingQuestion[]>(),
    pricingCategories: text("pricing_categories", { mode: "json" }).notNull().$type<ExcursionPricingCategory[]>(),
    rates: text("rates", { mode: "json" }).notNull().$type<ExcursionRate[]>(),
    pickupPlaces: text("pickup_places", { mode: "json" }).notNull().$type<ExcursionPlace[]>(),
    dropoffPlaces: text("dropoff_places", { mode: "json" }).notNull().$type<ExcursionPlace[]>(),
    startTimes: text("start_times", { mode: "json" }).notNull().$type<ExcursionStartTime[]>(),
    extras: text("extras", { mode: "json" }).notNull().$type<ExcursionExtra[]>(),
  },
  (table) => [
    uniqueIndex("excursion_provider_data_excursion_unique").on(table.excursionId),
    uniqueIndex("excursion_provider_data_product_unique").on(table.providerProductId),
  ]
);

export const weatherProfiles = sqliteTable("weather_profiles", {
  ...id,
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  note: text("note").notNull(),
});

export const weatherSeasons = sqliteTable("weather_seasons", {
  ...id,
  weatherProfileId: integer("weather_profile_id")
    .notNull()
    .references(() => weatherProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  months: text("months").notNull(),
  tempFRange: text("temp_f_range").notNull(),
  tempCRange: text("temp_c_range").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const travelRequirementItems = sqliteTable("travel_requirement_items", {
  ...id,
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinations.id, { onDelete: "cascade" }),
  icon: text("icon").notNull(),
  swatchColor: text("swatch_color").notNull(),
  heading: text("heading").notNull(),
  qrCodeUrl: text("qr_code_url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const travelRequirementBullets = sqliteTable("travel_requirement_bullets", {
  ...id,
  itemId: integer("item_id")
    .notNull()
    .references(() => travelRequirementItems.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const termsTemplates = sqliteTable("terms_templates", {
  ...id,
  name: text("name").notNull(),
  version: integer("version").notNull().default(1),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const termsSections = sqliteTable("terms_sections", {
  ...id,
  templateId: integer("template_id")
    .notNull()
    .references(() => termsTemplates.id, { onDelete: "cascade" }),
  heading: text("heading").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const termsParagraphs = sqliteTable("terms_paragraphs", {
  ...id,
  sectionId: integer("section_id")
    .notNull()
    .references(() => termsSections.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Reusable content library — global snapshots copied into proposals on use.
// Archiving removes an item from pickers without invalidating proposals that
// already copied it (or image URLs embedded in immutable revisions).
// ---------------------------------------------------------------------------

export const librarySections = sqliteTable("library_sections", {
  ...id,
  name: text("name").notNull(),
  description: text("description"),
  sectionType: text("section_type").notNull(),
  payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  variantId: text("variant_id"),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>(),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  ...timestamps,
});

export const librarySnippets = sqliteTable("library_snippets", {
  ...id,
  name: text("name").notNull(),
  body: text("body").notNull(),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>(),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  ...timestamps,
});

export const libraryImages = sqliteTable("library_images", {
  ...id,
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>(),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  ...timestamps,
});

export const libraryFees = sqliteTable(
  "library_fees",
  {
    ...id,
    name: text("name").notNull(),
    description: text("description"),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    currency: text("currency").notNull().default("USD"),
    unit: text("unit")
      .notNull()
      .$type<"flat" | "per_person" | "per_night" | "per_vehicle">()
      .default("flat"),
    taxRateBps: integer("tax_rate_bps").notNull().default(0),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (table) => [
    check(
      "library_fees_unit_check",
      sql`${table.unit} in ('flat', 'per_person', 'per_night', 'per_vehicle')`
    ),
    check("library_fees_price_check", sql`${table.unitPriceMinor} >= 0`),
    check("library_fees_tax_check", sql`${table.taxRateBps} >= 0 and ${table.taxRateBps} <= 10000`),
  ]
);

// ---------------------------------------------------------------------------
// Itineraries — reusable, design-independent trip skeletons a user builds
// before any client or document exists. Days are the single source of truth
// shared by every tier; hotel/excursion/flight/transport rows carry a
// nullable `tierId` — null means "applies to every tier" (shared/default),
// a value means "only shown/copied when that specific tier is selected".
// "Generate proposal" deep-copies an itinerary (filtered to one tier) into
// a brand-new real `proposals` row via copyItineraryGraphInto — see
// lib/db/copyItineraryGraphInto.ts. Deliberately separate from `proposals`
// rather than another `isTemplate`-style flag: itineraries have no client,
// no status pipeline, no real money (only a reference price per tier), and
// need per-row tier cardinality that would otherwise leak tier semantics
// into every real proposal's booking tables forever.
// ---------------------------------------------------------------------------

export const itineraries = sqliteTable("itineraries", {
  ...id,
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  destinationLabel: text("destination_label"),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  ...timestamps,
});

export const itineraryTiers = sqliteTable("itinerary_tiers", {
  ...id,
  itineraryId: integer("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // Reference/comparison price shown in the itinerary UI only — NOT the
  // real pricing engine, which only exists per-proposal (proposalPricing).
  priceMinor: integer("price_minor"),
  currency: text("currency"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itineraryDays = sqliteTable("itinerary_days", {
  ...id,
  itineraryId: integer("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  date: text("date"),
  subtitle: text("subtitle"),
  highlightLine: text("highlight_line"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itineraryDayActivities = sqliteTable("itinerary_day_activities", {
  ...id,
  dayId: integer("day_id")
    .notNull()
    .references(() => itineraryDays.id, { onDelete: "cascade" }),
  timeRange: text("time_range"),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itineraryDayParagraphs = sqliteTable("itinerary_day_paragraphs", {
  ...id,
  dayId: integer("day_id")
    .notNull()
    .references(() => itineraryDays.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itineraryDayImages = sqliteTable("itinerary_day_images", {
  ...id,
  dayId: integer("day_id")
    .notNull()
    .references(() => itineraryDays.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itineraryHotels = sqliteTable("itinerary_hotels", {
  ...id,
  itineraryId: integer("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" }),
  tierId: integer("tier_id").references(() => itineraryTiers.id, { onDelete: "cascade" }),
  hotelId: integer("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "restrict" }),
  roomCategory: text("room_category").notNull(),
  mealPlan: text("meal_plan").notNull(),
  nights: integer("nights").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itineraryExcursions = sqliteTable("itinerary_excursions", {
  ...id,
  itineraryId: integer("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" }),
  tierId: integer("tier_id").references(() => itineraryTiers.id, { onDelete: "cascade" }),
  excursionId: integer("excursion_id")
    .notNull()
    .references(() => excursions.id, { onDelete: "restrict" }),
  priceOverride: real("price_override"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Flights — structured per itinerary, deliberately no reusable global
// catalog (unlike hotels/excursions): a specific flight leg rarely repeats
// identically across different trips.
export const itineraryFlights = sqliteTable("itinerary_flights", {
  ...id,
  itineraryId: integer("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" }),
  tierId: integer("tier_id").references(() => itineraryTiers.id, { onDelete: "cascade" }),
  carrier: text("carrier"),
  flightNumber: text("flight_number"),
  originAirport: text("origin_airport"),
  destinationAirport: text("destination_airport"),
  departureAt: integer("departure_at", { mode: "timestamp" }),
  arrivalAt: integer("arrival_at", { mode: "timestamp" }),
  cabinClass: text("cabin_class"),
  costMinor: integer("cost_minor"),
  currency: text("currency"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Ground transportation — same treatment as flights: structured, no catalog.
export const itineraryTransport = sqliteTable("itinerary_transport", {
  ...id,
  itineraryId: integer("itinerary_id")
    .notNull()
    .references(() => itineraries.id, { onDelete: "cascade" }),
  tierId: integer("tier_id").references(() => itineraryTiers.id, { onDelete: "cascade" }),
  mode: text("mode"),
  description: text("description"),
  vehicleType: text("vehicle_type"),
  pickupLocation: text("pickup_location"),
  dropoffLocation: text("dropoff_location"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  costMinor: integer("cost_minor"),
  currency: text("currency"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Clients & proposals — transactional data, one row set per client engagement.
// ---------------------------------------------------------------------------

export const clients = sqliteTable("clients", {
  ...id,
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
});

export const proposals = sqliteTable(
  "proposals",
  {
    ...id,
    proposalNumber: text("proposal_number").notNull().unique(),
    leadClientId: integer("lead_client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    status: text("status")
      .notNull()
      .$type<"draft" | "sent" | "viewed" | "approved" | "lost" | "archived">()
      .default("draft"),
    designId: text("design_id"),
    designVersion: integer("design_version"),
    packageName: text("package_name"),
    selectedTier: text("selected_tier"),
    specialOccasion: text("special_occasion"),
    arrivalAirport: text("arrival_airport"),
    departureAirport: text("departure_airport"),
    termsTemplateId: integer("terms_template_id").references(() => termsTemplates.id, {
      onDelete: "set null",
    }),
    coverTitle: text("cover_title").notNull().default("Proposal"),
    coverSubtitle: text("cover_subtitle"),
    coverImageUrl: text("cover_image_url"),
    travelDatesLabel: text("travel_dates_label"),
    packageTotalLabel: text("package_total_label"),
    passengerManifestLabel: text("passenger_manifest_label"),
    isTemplate: integer("is_template", { mode: "boolean" }).notNull().default(false),
    templateName: text("template_name"),
    templateDescription: text("template_description"),
    templateThumbnailUrl: text("template_thumbnail_url"),
    pipelineStage: text("pipeline_stage").$type<"draft" | "sent" | "viewed" | "approved" | "won" | "lost" | "archived">(),
    lostReason: text("lost_reason"),
    closedValueMinor: integer("closed_value_minor"),
    closedCurrency: text("closed_currency"),
    ...timestamps,
  },
  (table) => [
    check(
      "proposals_status_check",
      sql`${table.status} in ('draft', 'sent', 'viewed', 'approved', 'lost', 'archived')`
    ),
  ]
);

export const proposalClients = sqliteTable(
  "proposal_clients",
  {
    ...id,
    proposalId: integer("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    role: text("role").notNull().$type<"lead" | "traveler">().default("traveler"),
  },
  (table) => [
    check("proposal_clients_role_check", sql`${table.role} in ('lead', 'traveler')`),
  ]
);

export const proposalDays = sqliteTable("proposal_days", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  date: text("date"),
  subtitle: text("subtitle"),
  highlightLine: text("highlight_line"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalDayActivities = sqliteTable("proposal_day_activities", {
  ...id,
  dayId: integer("day_id")
    .notNull()
    .references(() => proposalDays.id, { onDelete: "cascade" }),
  timeRange: text("time_range"),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalDayParagraphs = sqliteTable("proposal_day_paragraphs", {
  ...id,
  dayId: integer("day_id")
    .notNull()
    .references(() => proposalDays.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalDayImages = sqliteTable("proposal_day_images", {
  ...id,
  dayId: integer("day_id")
    .notNull()
    .references(() => proposalDays.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalHotels = sqliteTable("proposal_hotels", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  hotelId: integer("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "restrict" }),
  roomCategory: text("room_category").notNull(),
  mealPlan: text("meal_plan").notNull(),
  nights: integer("nights").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalExcursions = sqliteTable("proposal_excursions", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  excursionId: integer("excursion_id")
    .notNull()
    .references(() => excursions.id, { onDelete: "restrict" }),
  priceOverride: real("price_override"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Flights/transportation are proposal-scoped, structured, catalog-less rows
// (same treatment as their itinerary_flights/itinerary_transport source —
// see the "Itineraries" section above) rendered by dedicated flightDetails/
// transportDetails document blocks via a proposalSections row with a null
// refId (there's nothing narrower than "this proposal" to point at, unlike
// hotel/weather rows which point at a specific booking/destination).
export const proposalFlights = sqliteTable("proposal_flights", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  carrier: text("carrier"),
  flightNumber: text("flight_number"),
  originAirport: text("origin_airport"),
  destinationAirport: text("destination_airport"),
  departureAt: integer("departure_at", { mode: "timestamp" }),
  arrivalAt: integer("arrival_at", { mode: "timestamp" }),
  cabinClass: text("cabin_class"),
  costMinor: integer("cost_minor"),
  currency: text("currency"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalTransport = sqliteTable("proposal_transport", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  mode: text("mode"),
  description: text("description"),
  vehicleType: text("vehicle_type"),
  pickupLocation: text("pickup_location"),
  dropoffLocation: text("dropoff_location"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  costMinor: integer("cost_minor"),
  currency: text("currency"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalListSections = sqliteTable(
  "proposal_list_sections",
  {
    ...id,
    proposalId: integer("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().$type<"inclusion" | "exclusion">(),
    column: text("column").notNull().$type<"left" | "right">(),
    heading: text("heading").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    check("proposal_list_sections_kind_check", sql`${table.kind} in ('inclusion', 'exclusion')`),
    check("proposal_list_sections_column_check", sql`${table.column} in ('left', 'right')`),
  ]
);

export const proposalListLines = sqliteTable("proposal_list_lines", {
  ...id,
  sectionId: integer("section_id")
    .notNull()
    .references(() => proposalListSections.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const proposalPricing = sqliteTable("proposal_pricing", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" })
    .unique(),
  introText: text("intro_text"),
  invoiceTotal: real("invoice_total").notNull(),
  commission: real("commission").notNull().default(0),
  amountDue: real("amount_due").notNull(),
  currency: text("currency").notNull().default("USD"),
  bankAccountId: integer("bank_account_id").references(() => companyBankAccounts.id, {
    onDelete: "set null",
  }),
});

export const proposalPricingItems = sqliteTable(
  "proposal_pricing_items",
  {
    ...id,
    publicId: text("public_id").notNull().unique(),
    proposalId: integer("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantityMilli: integer("quantity_milli").notNull().default(1000),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    currency: text("currency").notNull().default("USD"),
    unit: text("unit").notNull().$type<"flat" | "per_person" | "per_night" | "per_vehicle">().default("flat"),
    taxRateBps: integer("tax_rate_bps").notNull().default(0),
    discountType: text("discount_type").notNull().$type<"none" | "amount" | "percent">().default("none"),
    discountValue: integer("discount_value").notNull().default(0),
    optional: integer("optional", { mode: "boolean" }).notNull().default(false),
    selectedByDefault: integer("selected_by_default", { mode: "boolean" }).notNull().default(true),
    quantityEditable: integer("quantity_editable", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    check("proposal_pricing_items_quantity_check", sql`${table.quantityMilli} >= 1`),
    check("proposal_pricing_items_price_check", sql`${table.unitPriceMinor} >= 0`),
    check("proposal_pricing_items_tax_check", sql`${table.taxRateBps} >= 0 and ${table.taxRateBps} <= 10000`),
    check("proposal_pricing_items_unit_check", sql`${table.unit} in ('flat', 'per_person', 'per_night', 'per_vehicle')`),
    check("proposal_pricing_items_discount_type_check", sql`${table.discountType} in ('none', 'amount', 'percent')`),
  ]
);

export const proposalPaymentSchedule = sqliteTable("proposal_payment_schedule", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  valueText: text("value_text").notNull(),
  amountType: text("amount_type").notNull().$type<"text" | "fixed" | "percentage">().default("text"),
  amountMinor: integer("amount_minor"),
  percentageBps: integer("percentage_bps"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Drives which blocks render for a given proposal, and in what order —
// replaces the hand-assembled `sections[]` array in sampleProposalData.ts.
// `refId` points at the catalog/proposal row the section is about (a hotel
// booking, a city) when there is one to point at. `payload` is a JSON escape
// hatch for one-off presentational content (divider titles, cover-style
// copy) that isn't worth its own table because nothing else references it.
// `fromOwnersOverride` (a proposal-scoped content override, not sharing or
// lifecycle metadata) still uses this table as virtual metadata, filtered
// out before document rendering — see lib/db/virtualSectionTypes.ts. The
// other virtual types that used to live here (documentDesign, pdfGeneration,
// proposalRevision, shareSettings, proposalLifecycleEvent, proposalApproval)
// were promoted to real tables/columns below (Fase 12.1).
// "cover", "fromOwners" and "details" are NOT stored here — they're derived
// directly from `proposals`/`company` on every proposal, so there's nothing
// to order or toggle.
export const proposalSections = sqliteTable("proposal_sections", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  sectionType: text("section_type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  refId: integer("ref_id"),
  payload: text("payload", { mode: "json" }),
});

// ---------------------------------------------------------------------------
// Revisions & sharing — an immutable content snapshot per share, a public
// token pointing at one, and an append-only event log. Replaces the
// proposalRevision/shareSettings/proposalLifecycleEvent/proposalApproval/
// pdfGeneration virtual rows that used to live in proposal_sections.
// ---------------------------------------------------------------------------

// A full point-in-time copy of a proposal's rendered content + active
// design, taken when a share link is created. `/share/[token]` always
// renders `data`/`design` as stored here, never the live proposal — later
// edits to the proposal cannot retroactively change what a client already
// received a link to.
export const proposalRevisions = sqliteTable("proposal_revisions", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  designId: text("design_id").notNull(),
  designVersion: integer("design_version").notNull(),
  data: text("data", { mode: "json" }).notNull().$type<ProposalData>(),
  // Raw merge-field tokens are retained for audit/reuse while `data` is the
  // immutable, resolved document rendered by the public share.
  rawData: text("raw_data", { mode: "json" }).$type<ProposalData>(),
  design: text("design", { mode: "json" }).notNull().$type<DocumentDesignDescriptor>(),
  sealedAt: integer("sealed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const proposalShares = sqliteTable("proposal_shares", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  revisionId: integer("revision_id")
    .notNull()
    .references(() => proposalRevisions.id, { onDelete: "restrict" }),
  token: text("token").notNull().unique(),
  passwordSalt: text("password_salt"),
  passwordHash: text("password_hash"),
  accessKey: text("access_key"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const proposalSharePricingSelections = sqliteTable(
  "proposal_share_pricing_selections",
  {
    ...id,
    shareId: integer("share_id")
      .notNull()
      .references(() => proposalShares.id, { onDelete: "cascade" }),
    itemPublicId: text("item_public_id").notNull(),
    selected: integer("selected", { mode: "boolean" }).notNull(),
    quantityMilli: integer("quantity_milli").notNull(),
    frozenAt: integer("frozen_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("share_pricing_item_unique").on(table.shareId, table.itemPublicId),
    check("share_pricing_quantity_check", sql`${table.quantityMilli} >= 1`),
  ]
);

export const proposalSignatures = sqliteTable("proposal_signatures", {
  ...id,
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  shareId: integer("share_id").notNull().references(() => proposalShares.id, { onDelete: "restrict" }),
  revisionId: integer("revision_id").notNull().references(() => proposalRevisions.id, { onDelete: "restrict" }),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email"),
  signerRole: text("signer_role").notNull(),
  signatureType: text("signature_type").notNull().$type<"typed" | "drawn">(),
  signatureData: text("signature_data").notNull(),
  ipAddressTruncated: text("ip_address_truncated"),
  userAgent: text("user_agent"),
  payloadHash: text("payload_hash").notNull(),
  signedAt: integer("signed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const proposalEmails = sqliteTable("proposal_emails", {
  ...id,
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  shareId: integer("share_id").references(() => proposalShares.id, { onDelete: "set null" }),
  kind: text("kind").notNull().$type<"send" | "reminder">(),
  recipients: text("recipients", { mode: "json" }).notNull().$type<string[]>(),
  subject: text("subject").notNull(),
  provider: text("provider").notNull(),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull().$type<"sent" | "file" | "link_only" | "failed">(),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const proposalNotificationSettings = sqliteTable("proposal_notification_settings", {
  ...id,
  proposalId: integer("proposal_id").notNull().unique().references(() => proposals.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email"),
  firstOpenEnabled: integer("first_open_enabled", { mode: "boolean" }).notNull().default(true),
  signatureEnabled: integer("signature_enabled", { mode: "boolean" }).notNull().default(true),
  expiryEnabled: integer("expiry_enabled", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const proposalNotifications = sqliteTable("proposal_notifications", {
  ...id,
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  shareId: integer("share_id").references(() => proposalShares.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<"first_open" | "signature" | "expiring" | "comment">(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  readAt: integer("read_at", { mode: "timestamp" }),
  emailedAt: integer("emailed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const proposalCommentThreads = sqliteTable("proposal_comment_threads", {
  ...id,
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  shareId: integer("share_id").notNull().references(() => proposalShares.id, { onDelete: "cascade" }),
  revisionId: integer("revision_id").notNull().references(() => proposalRevisions.id, { onDelete: "restrict" }),
  sectionKey: text("section_key").notNull(),
  sourceSectionId: integer("source_section_id"),
  status: text("status").notNull().$type<"open" | "resolved">().default("open"),
  orphaned: integer("orphaned", { mode: "boolean" }).notNull().default(false),
  clientName: text("client_name").notNull(),
  ...timestamps,
});

export const proposalComments = sqliteTable("proposal_comments", {
  ...id,
  threadId: integer("thread_id").notNull().references(() => proposalCommentThreads.id, { onDelete: "cascade" }),
  authorType: text("author_type").notNull().$type<"client" | "seller">(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const proposalInternalNotes = sqliteTable("proposal_internal_notes", {
  ...id,
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  sectionKey: text("section_key").notNull(),
  sourceSectionId: integer("source_section_id"),
  body: text("body").notNull(),
  ...timestamps,
});

export const proposalEvents = sqliteTable(
  "proposal_events",
  {
    ...id,
    proposalId: integer("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    // Nullable: pdf_generated/pdf_failed events aren't tied to a share.
    shareId: integer("share_id").references(() => proposalShares.id, { onDelete: "cascade" }),
    type: text("type")
      .notNull()
      .$type<"shared" | "sent" | "reminder" | "opened" | "approved" | "signed" | "lost" | "reopened" | "pricing_selected" | "engagement" | "comment_added" | "comment_replied" | "comment_resolved" | "notification_sent" | "pdf_generated" | "pdf_downloaded" | "pdf_failed">(),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    check(
      "proposal_events_type_check",
      sql`${table.type} in ('shared', 'sent', 'reminder', 'opened', 'approved', 'signed', 'lost', 'reopened', 'pricing_selected', 'engagement', 'comment_added', 'comment_replied', 'comment_resolved', 'notification_sent', 'pdf_generated', 'pdf_downloaded', 'pdf_failed')`
    ),
  ]
);
