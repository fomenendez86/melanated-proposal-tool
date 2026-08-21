import { asc, eq, inArray } from "drizzle-orm";

import {
  paginateDayItinerary,
  paginateExcursionList,
  paginateOverview,
  paginateTermsConditions,
  renumberSections,
} from "@/lib/paginate";
import type {
  DayEntry,
  DetailRow,
  ExcursionItem,
  ImportantItemRow,
  ItineraryDay,
  KeyValueLine,
  ProposalData,
  ProposalSection,
  TermsSection,
  TitleLine,
  TwoColumnListSection,
  WeatherTable,
} from "@/lib/types";

import { db } from "./client";
import {
  cities,
  clients,
  company,
  companyAboutParagraphs,
  companyBankAccounts,
  companyFounders,
  destinations,
  excursionImages,
  excursions,
  hotelImages,
  hotels,
  proposalDayActivities,
  proposalDayImages,
  proposalDayParagraphs,
  proposalDays,
  proposalExcursions,
  proposalHotels,
  proposalListLines,
  proposalListSections,
  proposalPaymentSchedule,
  proposalPricing,
  proposalSections,
  proposals,
  termsParagraphs,
  termsSections,
  travelRequirementBullets,
  travelRequirementItems,
  weatherProfiles,
  weatherSeasons,
} from "./schema";

type TriangleDividerPayload = {
  sectionLabel: string;
  titleLines: TitleLine[];
  imageUrl: string;
};

type SectionDividerPayload = {
  title: string;
  subtitle?: string;
  imageUrl: string;
};

type CityToursPayload = {
  intro: string;
  priceNote: string;
  imageUrl: string;
};

type TwoColumnPayload = {
  title: string;
  kind: "inclusion" | "exclusion";
};

type ThankYouPayload = {
  message: string;
  imageUrl: string;
};

type FromOwnersPayload = {
  paragraphs?: string[];
  founders?: Array<{ name: string; title: string }>;
  photoUrl?: string;
};

type HotelPayload = {
  name?: string;
  description?: string;
  images?: {
    topRight?: string;
    bottomLeftTop?: string;
    bottomLeftBottom?: string;
  };
};

type ImportantItemsPayload = {
  snapshot?: ImportantItemRow[];
};

type ExcursionListPayload = {
  snapshot?: ExcursionItem[];
};

type WeatherPayload = {
  snapshot?: WeatherTable[];
};

type TermsPayload = {
  snapshot?: TermsSection[];
};

async function buildOverviewDays(days: (typeof proposalDays.$inferSelect)[]): Promise<ItineraryDay[]> {
  const result: ItineraryDay[] = [];
  for (const day of days) {
    const activities = await db
      .select()
      .from(proposalDayActivities)
      .where(eq(proposalDayActivities.dayId, day.id))
      .orderBy(asc(proposalDayActivities.sortOrder));
    result.push({
      dayNumber: day.dayNumber,
      date: day.date ?? "",
      activities: activities.map((activity) => ({
        time: activity.timeRange ?? "",
        description: activity.description,
      })),
    });
  }
  return result;
}

async function buildDayEntries(days: (typeof proposalDays.$inferSelect)[]): Promise<DayEntry[]> {
  const result: DayEntry[] = [];
  for (const day of days) {
    const [paragraphs, images] = await Promise.all([
      db
        .select()
        .from(proposalDayParagraphs)
        .where(eq(proposalDayParagraphs.dayId, day.id))
        .orderBy(asc(proposalDayParagraphs.sortOrder)),
      db
        .select()
        .from(proposalDayImages)
        .where(eq(proposalDayImages.dayId, day.id))
        .orderBy(asc(proposalDayImages.sortOrder)),
    ]);
    result.push({
      dayNumber: day.dayNumber,
      subtitle: day.subtitle ?? undefined,
      highlightLine: day.highlightLine ?? undefined,
      paragraphs: paragraphs.map((p) => p.body),
      imageUrls: images.map((i) => i.url),
    });
  }
  return result;
}

function formatPrice(basePrice: number, priceNote: string | null): string {
  const amount = `$${basePrice.toLocaleString("en-US")}`;
  return priceNote ? `${amount} (${priceNote})` : amount;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export async function getProposalData(proposalId: number): Promise<ProposalData> {
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

  const [companyRow] = await db.select().from(company).limit(1);
  if (!companyRow) throw new Error("No company row seeded");

  const [leadClient] = await db.select().from(clients).where(eq(clients.id, proposal.leadClientId));

  const founders = await db
    .select()
    .from(companyFounders)
    .where(eq(companyFounders.companyId, companyRow.id))
    .orderBy(asc(companyFounders.sortOrder));

  const aboutParagraphs = await db
    .select()
    .from(companyAboutParagraphs)
    .where(eq(companyAboutParagraphs.companyId, companyRow.id))
    .orderBy(asc(companyAboutParagraphs.sortOrder));

  const days = await db
    .select()
    .from(proposalDays)
    .where(eq(proposalDays.proposalId, proposalId))
    .orderBy(asc(proposalDays.sortOrder));
  const overviewDays = await buildOverviewDays(days);
  const dayEntries = await buildDayEntries(days);

  const skeleton = await db
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.proposalId, proposalId))
    .orderBy(asc(proposalSections.sortOrder));
  const fromOwnersOverride = skeleton.find((row) => row.sectionType === "fromOwnersOverride");
  const fromOwnersPayload = (fromOwnersOverride?.payload ?? {}) as FromOwnersPayload;
  const ownerParagraphs = Array.isArray(fromOwnersPayload.paragraphs) && fromOwnersPayload.paragraphs.length > 0
    ? fromOwnersPayload.paragraphs
    : aboutParagraphs.map((paragraph) => paragraph.body);
  const ownerFounders = Array.isArray(fromOwnersPayload.founders) && fromOwnersPayload.founders.length > 0
    ? fromOwnersPayload.founders
    : founders.map((founder) => ({ name: founder.name, title: founder.title }));

  const sections: ProposalSection[] = [
    {
      type: "cover",
      data: {
        title: proposal.coverTitle,
        subtitle: proposal.coverSubtitle ?? "",
        clientLine: leadClient?.fullName ?? "",
        imageUrl: proposal.coverImageUrl ?? "",
      },
    },
    {
      type: "fromOwners",
      ...(fromOwnersOverride
        ? { editorSource: { sectionId: fromOwnersOverride.id, refId: fromOwnersOverride.refId } }
        : {}),
      data: {
        paragraphs: ownerParagraphs,
        founders: ownerFounders,
        photoUrl: fromOwnersPayload.photoUrl ?? companyRow.aboutPhotoUrl ?? "",
        pageNumber: 0,
      },
    },
    {
      type: "details",
      data: {
        rows: [
          { label: "Package Booked:", value: proposal.packageName ?? "" },
          { label: "Selected Tier:", value: proposal.selectedTier ?? "" },
          { label: "Dates:", value: proposal.travelDatesLabel ?? "" },
          { label: "Passenger Manifest:", value: proposal.passengerManifestLabel ?? "" },
          { label: "Special Occasion:", value: proposal.specialOccasion ?? "" },
          {
            label: "Airport Information",
            value: `Arrival(${proposal.arrivalAirport ?? "TBD"}); Departure(${proposal.departureAirport ?? "TBD"})`,
            emphasis: true,
          },
          { label: "Package Total:", value: proposal.packageTotalLabel ?? "" },
        ] satisfies DetailRow[],
        pageNumber: 0,
      },
    },
  ];

  for (const row of skeleton) {
    const editorSource = { sectionId: row.id, refId: row.refId };
    switch (row.sectionType) {
      case "overview": {
        sections.push(
          ...paginateOverview({ days: overviewDays, pageNumber: 0 }, 0).map((section) => ({
            ...section,
            editorSource,
          }))
        );
        break;
      }
      case "dayItinerary": {
        sections.push(
          ...paginateDayItinerary(dayEntries, 0).map((section) => ({ ...section, editorSource }))
        );
        break;
      }
      case "triangleDivider": {
        const payload = row.payload as TriangleDividerPayload;
        sections.push({
          type: "triangleDivider",
          editorSource,
          data: {
            sectionLabel: payload.sectionLabel,
            titleLines: payload.titleLines,
            imageUrl: payload.imageUrl,
            pageNumber: 0,
          },
        });
        break;
      }
      case "hotel": {
        if (row.refId == null) throw new Error(`hotel section ${row.id} missing refId`);
        const [booking] = await db.select().from(proposalHotels).where(eq(proposalHotels.id, row.refId));
        const [hotel] = await db.select().from(hotels).where(eq(hotels.id, booking.hotelId));
        const images = await db.select().from(hotelImages).where(eq(hotelImages.hotelId, hotel.id));
        const bySlot = (slot: string) => images.find((img) => img.slot === slot)?.url ?? "";
        const payload = (row.payload ?? {}) as HotelPayload;
        sections.push({
          type: "hotel",
          editorSource,
          data: {
            name: payload.name ?? hotel.name,
            roomCategory: booking.roomCategory,
            mealPlan: booking.mealPlan,
            description: payload.description ?? hotel.description,
            images: {
              topRight: payload.images?.topRight ?? bySlot("topRight"),
              bottomLeftTop: payload.images?.bottomLeftTop ?? bySlot("bottomLeftTop"),
              bottomLeftBottom: payload.images?.bottomLeftBottom ?? bySlot("bottomLeftBottom"),
            },
            pageNumber: 0,
          },
        });
        break;
      }
      case "sectionDivider": {
        const payload = row.payload as SectionDividerPayload;
        sections.push({
          type: "sectionDivider",
          editorSource,
          data: {
            title: payload.title,
            subtitle: payload.subtitle,
            imageUrl: payload.imageUrl,
            pageNumber: 0,
          },
        });
        break;
      }
      case "cityToursDivider": {
        if (row.refId == null) throw new Error(`cityToursDivider section ${row.id} missing refId`);
        const payload = row.payload as CityToursPayload;
        const [city] = await db.select().from(cities).where(eq(cities.id, row.refId));
        sections.push({
          type: "cityToursDivider",
          editorSource,
          data: {
            city: city.name,
            intro: payload.intro,
            priceNote: payload.priceNote,
            imageUrl: payload.imageUrl,
            pageNumber: 0,
          },
        });
        break;
      }
      case "excursionList": {
        if (row.refId == null) throw new Error(`excursionList section ${row.id} missing refId`);
        const payload = row.payload as ExcursionListPayload | null;
        const items: ExcursionItem[] = Array.isArray(payload?.snapshot) ? payload.snapshot : [];
        if (items.length === 0) {
          const rows = await db
            .select({
              sortOrder: proposalExcursions.sortOrder,
              priceOverride: proposalExcursions.priceOverride,
              title: excursions.title,
              description: excursions.description,
              basePrice: excursions.basePrice,
              priceNote: excursions.priceNote,
              excursionId: excursions.id,
            })
            .from(proposalExcursions)
            .innerJoin(excursions, eq(proposalExcursions.excursionId, excursions.id))
            .where(eq(excursions.cityId, row.refId))
            .orderBy(asc(proposalExcursions.sortOrder));

          for (const item of rows) {
            const [image] = await db
              .select()
              .from(excursionImages)
              .where(eq(excursionImages.excursionId, item.excursionId))
              .orderBy(asc(excursionImages.sortOrder))
              .limit(1);
            items.push({
              title: item.title,
              description: item.description,
              price: formatPrice(item.priceOverride ?? item.basePrice, item.priceNote),
              imageUrl: image?.url ?? "",
            });
          }
        }
        sections.push(
          ...paginateExcursionList({ items, pageNumber: 0 }, 0).map((section) => ({
            ...section,
            editorSource,
          }))
        );
        break;
      }
      case "twoColumnList": {
        const payload = row.payload as TwoColumnPayload;
        const listSections = await db
          .select()
          .from(proposalListSections)
          .where(eq(proposalListSections.proposalId, proposalId))
          .orderBy(asc(proposalListSections.sortOrder));

        const buildColumn = async (column: "left" | "right"): Promise<TwoColumnListSection[]> => {
          const filtered = listSections.filter((s) => s.kind === payload.kind && s.column === column);
          const out: TwoColumnListSection[] = [];
          for (const section of filtered) {
            const lines = await db
              .select()
              .from(proposalListLines)
              .where(eq(proposalListLines.sectionId, section.id))
              .orderBy(asc(proposalListLines.sortOrder));
            out.push({ heading: section.heading, lines: lines.map((l) => l.text) });
          }
          return out;
        };

        sections.push({
          type: "twoColumnList",
          editorSource,
          data: {
            title: payload.title,
            leftColumn: await buildColumn("left"),
            rightColumn: await buildColumn("right"),
            pageNumber: 0,
          },
        });
        break;
      }
      case "pricing": {
        const [pricing] = await db.select().from(proposalPricing).where(eq(proposalPricing.proposalId, proposalId));
        const schedule = await db
          .select()
          .from(proposalPaymentSchedule)
          .where(eq(proposalPaymentSchedule.proposalId, proposalId))
          .orderBy(asc(proposalPaymentSchedule.sortOrder));
        const bankingInfo: KeyValueLine[] = [];
        if (pricing.bankAccountId != null) {
          const [bank] = await db
            .select()
            .from(companyBankAccounts)
            .where(eq(companyBankAccounts.id, pricing.bankAccountId));
          if (bank) {
            bankingInfo.push(
              { label: "Bank Name", value: bank.bankName },
              { label: "Beneficiary Name", value: bank.beneficiaryName },
              { label: "SWIFT Code(Intl.)", value: bank.swiftCode ?? "" },
              { label: "Routing Number(USA)", value: bank.routingNumber ?? "" },
              { label: "Account Number", value: bank.accountNumber },
              { label: "Company Address", value: companyRow.address ?? "" }
            );
          }
        }
        sections.push({
          type: "pricing",
          editorSource,
          data: {
            intro: pricing.introText ?? "",
            packagePricing: [
              { label: "Invoice Total", value: formatMoney(pricing.invoiceTotal, pricing.currency) },
              { label: "Commission", value: formatMoney(pricing.commission, pricing.currency) },
              { label: "Amount Due", value: formatMoney(pricing.amountDue, pricing.currency) },
            ],
            paymentSchedule: schedule.map((s) => ({ label: s.label, value: s.valueText })),
            bankingInfo,
            pageNumber: 0,
          },
        });
        break;
      }
      case "importantItems": {
        if (row.refId == null) throw new Error(`importantItems section ${row.id} missing refId`);
        const destRows = await db.select().from(destinations).where(eq(destinations.countryId, row.refId));
        const destIds = destRows.map((d) => d.id);
        const items = destIds.length
          ? await db
              .select()
              .from(travelRequirementItems)
              .where(inArray(travelRequirementItems.destinationId, destIds))
              .orderBy(asc(travelRequirementItems.sortOrder))
          : [];
        const payload = (row.payload ?? {}) as ImportantItemsPayload;
        const rows: ImportantItemRow[] = Array.isArray(payload.snapshot) ? payload.snapshot : [];
        if (rows.length === 0) {
          for (const item of items) {
            const bullets = await db
              .select()
              .from(travelRequirementBullets)
              .where(eq(travelRequirementBullets.itemId, item.id))
              .orderBy(asc(travelRequirementBullets.sortOrder));
            rows.push({
              icon: item.icon,
              swatchColor: item.swatchColor,
              heading: item.heading,
              bullets: bullets.map((b) => b.text),
              qrCodeUrl: item.qrCodeUrl ?? undefined,
            });
          }
        }
        sections.push({ type: "importantItems", data: { rows, pageNumber: 0 }, editorSource });
        break;
      }
      case "fromOwnersOverride":
      case "documentDesign":
        break;
      case "weather": {
        if (row.refId == null) throw new Error(`weather section ${row.id} missing refId`);
        const payload = row.payload as WeatherPayload | null;
        const tables: WeatherTable[] = Array.isArray(payload?.snapshot) ? payload.snapshot : [];
        if (tables.length === 0) {
          const destRows = await db.select().from(destinations).where(eq(destinations.countryId, row.refId));
          const destIds = destRows.map((d) => d.id);
          const profiles = destIds.length
            ? await db
                .select()
                .from(weatherProfiles)
                .where(inArray(weatherProfiles.destinationId, destIds))
                .orderBy(asc(weatherProfiles.id))
            : [];
          for (const profile of profiles) {
            const seasons = await db
              .select()
              .from(weatherSeasons)
              .where(eq(weatherSeasons.weatherProfileId, profile.id))
              .orderBy(asc(weatherSeasons.sortOrder));
            tables.push({
              title: profile.title,
              note: profile.note,
              seasons: seasons.map((s) => ({
                name: s.name,
                icon: s.icon ?? undefined,
                months: s.months,
                tempF: s.tempFRange,
                tempC: s.tempCRange,
              })),
            });
          }
        }
        sections.push({ type: "weather", data: { tables, pageNumber: 0 }, editorSource });
        break;
      }
      case "termsConditions": {
        if (proposal.termsTemplateId == null) break;
        const payload = row.payload as TermsPayload | null;
        const built: TermsSection[] = Array.isArray(payload?.snapshot) ? payload.snapshot : [];
        if (built.length === 0) {
          const templateSections = await db
            .select()
            .from(termsSections)
            .where(eq(termsSections.templateId, proposal.termsTemplateId))
            .orderBy(asc(termsSections.sortOrder));
          for (const section of templateSections) {
            const paragraphs = await db
              .select()
              .from(termsParagraphs)
              .where(eq(termsParagraphs.sectionId, section.id))
              .orderBy(asc(termsParagraphs.sortOrder));
            built.push({ heading: section.heading, paragraphs: paragraphs.map((p) => p.body) });
          }
        }
        sections.push(
          ...paginateTermsConditions({ sections: built, pageNumber: 0, showTitle: true }, 0).map(
            (section) => ({ ...section, editorSource })
          )
        );
        break;
      }
      case "thankYou": {
        const payload = row.payload as ThankYouPayload;
        sections.push({
          type: "thankYou",
          editorSource,
          data: { message: payload.message, imageUrl: payload.imageUrl, pageNumber: 0 },
        });
        break;
      }
      default:
        throw new Error(`Unknown proposal_sections.sectionType: ${row.sectionType}`);
    }
  }

  return { sections: renumberSections(sections, 2) };
}
