import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { DocumentDesignDescriptor } from "@/lib/designs/types";
import type { ProposalData } from "@/lib/types";

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
  sortOrder: integer("sort_order").notNull().default(0),
});

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

export const proposalPaymentSchedule = sqliteTable("proposal_payment_schedule", {
  ...id,
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  valueText: text("value_text").notNull(),
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
  design: text("design", { mode: "json" }).notNull().$type<DocumentDesignDescriptor>(),
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
      .$type<"shared" | "opened" | "approved" | "pdf_generated" | "pdf_failed">(),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    check(
      "proposal_events_type_check",
      sql`${table.type} in ('shared', 'opened', 'approved', 'pdf_generated', 'pdf_failed')`
    ),
  ]
);
