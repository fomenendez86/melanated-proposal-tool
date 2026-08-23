"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type {
  CatalogMutationResult,
  CreateCatalogExcursionInput,
  CreateCatalogHotelInput,
} from "@/lib/catalog/types";
import { resolveInsertionOrders } from "@/lib/composition/insertionOrder";
import { db } from "@/lib/db/client";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import {
  cities,
  excursionImages,
  excursions,
  hotelImages,
  hotels,
  proposalExcursions,
  proposalHotels,
  proposalSections,
  proposals,
} from "@/lib/db/schema";

async function validateProposalAndSections(proposalId: number, requiredTypes: Array<"hotel" | "triangleDivider" | "cityToursDivider" | "excursionList">) {
  const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return "Proposal not found.";
  const data = await getProposalData(proposalId);
  const context = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));
  const supported = new Set(context.active.supportedSectionTypes);
  const unsupported = requiredTypes.filter((type) => !supported.has(type));
  return unsupported.length > 0
    ? `${context.active.name} does not support: ${unsupported.join(", ")}.`
    : null;
}

function nextSortOrder(rows: Array<{ sortOrder: number }>) {
  return rows.reduce((highest, row) => Math.max(highest, row.sortOrder), 0) + 10;
}

function validImageUrl(value: string | undefined) {
  return !value || value.startsWith("/") || /^https:\/\//i.test(value);
}

export async function addCatalogHotelToProposal(proposalId: number, hotelId: number, afterSectionId?: number | null): Promise<CatalogMutationResult> {
  if (!Number.isInteger(proposalId) || proposalId < 1 || !Number.isInteger(hotelId) || hotelId < 1) {
    return { ok: false, formError: "Invalid hotel selection." };
  }
  const compatibilityError = await validateProposalAndSections(proposalId, ["triangleDivider", "hotel"]);
  if (compatibilityError) return { ok: false, formError: compatibilityError };

  const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId));
  if (!hotel) return { ok: false, formError: "Hotel not found." };
  const [duplicate] = await db
    .select({ id: proposalHotels.id })
    .from(proposalHotels)
    .where(and(eq(proposalHotels.proposalId, proposalId), eq(proposalHotels.hotelId, hotelId)))
    .limit(1);
  if (duplicate) return { ok: false, formError: "This hotel is already in the proposal." };

  const [sectionRows, bookingRows, images] = await Promise.all([
    db.select({ id: proposalSections.id, sortOrder: proposalSections.sortOrder }).from(proposalSections).where(eq(proposalSections.proposalId, proposalId)),
    db.select({ sortOrder: proposalHotels.sortOrder }).from(proposalHotels).where(eq(proposalHotels.proposalId, proposalId)),
    db.select().from(hotelImages).where(eq(hotelImages.hotelId, hotelId)).orderBy(asc(hotelImages.sortOrder)),
  ]);
  const resolved = resolveInsertionOrders(sectionRows, afterSectionId, 2);
  if (!resolved) return { ok: false, formError: "That insertion position no longer exists." };
  const bookingOrder = nextSortOrder(bookingRows);

  try {
    db.transaction((transaction) => {
      resolved.shifts.forEach((shift) => transaction.update(proposalSections).set({ sortOrder: shift.sortOrder }).where(and(eq(proposalSections.id, shift.id), eq(proposalSections.proposalId, proposalId))).run());
      const booking = transaction
        .insert(proposalHotels)
        .values({
          proposalId,
          hotelId,
          roomCategory: hotel.defaultRoomCategory,
          mealPlan: hotel.defaultMealPlan,
          nights: 1,
          sortOrder: bookingOrder,
        })
        .returning({ id: proposalHotels.id })
        .get();
      transaction.insert(proposalSections).values([
        {
          proposalId,
          sectionType: "triangleDivider",
          sortOrder: resolved.orders[0],
          refId: booking.id,
          payload: {
            sectionLabel: "Accommodations",
            titleLines: [{ text: hotel.name, style: "bold" }],
            imageUrl: images[0]?.url ?? "",
          },
        },
        { proposalId, sectionType: "hotel", sortOrder: resolved.orders[1], refId: booking.id },
      ]).run();
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The hotel could not be added. Try again." };
  }

  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}

export async function addCatalogExcursionToProposal(proposalId: number, excursionId: number, afterSectionId?: number | null): Promise<CatalogMutationResult> {
  if (!Number.isInteger(proposalId) || proposalId < 1 || !Number.isInteger(excursionId) || excursionId < 1) {
    return { ok: false, formError: "Invalid excursion selection." };
  }

  const [excursion] = await db.select().from(excursions).where(eq(excursions.id, excursionId));
  if (!excursion) return { ok: false, formError: "Excursion not found." };
  const [duplicate] = await db
    .select({ id: proposalExcursions.id })
    .from(proposalExcursions)
    .where(and(eq(proposalExcursions.proposalId, proposalId), eq(proposalExcursions.excursionId, excursionId)))
    .limit(1);
  if (duplicate) return { ok: false, formError: "This excursion is already in the proposal." };

  const [existingList] = await db
    .select({ id: proposalSections.id })
    .from(proposalSections)
    .where(and(eq(proposalSections.proposalId, proposalId), eq(proposalSections.sectionType, "excursionList"), eq(proposalSections.refId, excursion.cityId)))
    .limit(1);
  const requiredTypes = existingList ? ["excursionList" as const] : ["cityToursDivider" as const, "excursionList" as const];
  const compatibilityError = await validateProposalAndSections(proposalId, requiredTypes);
  if (compatibilityError) return { ok: false, formError: compatibilityError };

  const [sectionRows, excursionRows, city, images] = await Promise.all([
    db.select({ id: proposalSections.id, sortOrder: proposalSections.sortOrder }).from(proposalSections).where(eq(proposalSections.proposalId, proposalId)),
    db.select({ sortOrder: proposalExcursions.sortOrder }).from(proposalExcursions).where(eq(proposalExcursions.proposalId, proposalId)),
    db.select().from(cities).where(eq(cities.id, excursion.cityId)).then((rows) => rows[0]),
    db.select().from(excursionImages).where(eq(excursionImages.excursionId, excursionId)).orderBy(asc(excursionImages.sortOrder)),
  ]);
  const resolved = existingList ? null : resolveInsertionOrders(sectionRows, afterSectionId, 2);
  if (!existingList && !resolved) return { ok: false, formError: "That insertion position no longer exists." };

  try {
    db.transaction((transaction) => {
      transaction.insert(proposalExcursions).values({
        proposalId,
        excursionId,
        sortOrder: nextSortOrder(excursionRows),
      }).run();
      if (!existingList && resolved) {
        resolved.shifts.forEach((shift) => transaction.update(proposalSections).set({ sortOrder: shift.sortOrder }).where(and(eq(proposalSections.id, shift.id), eq(proposalSections.proposalId, proposalId))).run());
        transaction.insert(proposalSections).values([
          {
            proposalId,
            sectionType: "cityToursDivider",
            sortOrder: resolved.orders[0],
            refId: excursion.cityId,
            payload: {
              intro: `Explore selected experiences in ${city?.name ?? "this destination"}.`,
              priceNote: "Prices and availability are subject to confirmation.",
              imageUrl: images[0]?.url ?? "",
            },
          },
          { proposalId, sectionType: "excursionList", sortOrder: resolved.orders[1], refId: excursion.cityId },
        ]).run();
      }
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The excursion could not be added. Try again." };
  }

  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}

export async function createCatalogHotelAndAdd(
  proposalId: number,
  input: CreateCatalogHotelInput
): Promise<CatalogMutationResult> {
  const name = input?.name?.trim();
  const description = input?.description?.trim();
  const room = input?.defaultRoomCategory?.trim();
  const meal = input?.defaultMealPlan?.trim();
  const imageUrl = input?.imageUrl?.trim();
  if (!Number.isInteger(input?.cityId) || input.cityId < 1 || !name || !description || !room || !meal) {
    return { ok: false, formError: "City, name, description, room category, and meal plan are required." };
  }
  if (name.length > 160 || description.length > 6000 || room.length > 120 || meal.length > 120) {
    return { ok: false, formError: "One or more hotel fields are too long." };
  }
  if (!validImageUrl(imageUrl)) return { ok: false, formError: "Use a local /path or an https:// image URL." };
  const compatibilityError = await validateProposalAndSections(proposalId, ["triangleDivider", "hotel"]);
  if (compatibilityError) return { ok: false, formError: compatibilityError };
  const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, input.cityId));
  if (!city) return { ok: false, formError: "City not found." };
  const cityHotels = await db.select({ name: hotels.name }).from(hotels).where(eq(hotels.cityId, input.cityId));
  if (cityHotels.some((hotel) => hotel.name.trim().toLowerCase() === name.toLowerCase())) {
    return { ok: false, formError: "A hotel with this name already exists in the selected city." };
  }

  let hotelId: number;
  try {
    hotelId = db.transaction((transaction) => {
      const hotel = transaction.insert(hotels).values({
        cityId: input.cityId,
        name,
        description,
        defaultRoomCategory: room,
        defaultMealPlan: meal,
      }).returning({ id: hotels.id }).get();
      if (imageUrl) {
        transaction.insert(hotelImages).values({ hotelId: hotel.id, url: imageUrl, slot: "topRight", sortOrder: 0 }).run();
      }
      return hotel.id;
    });
  } catch {
    return { ok: false, formError: "The hotel could not be created." };
  }
  return addCatalogHotelToProposal(proposalId, hotelId);
}

export async function createCatalogExcursionAndAdd(
  proposalId: number,
  input: CreateCatalogExcursionInput
): Promise<CatalogMutationResult> {
  const title = input?.title?.trim();
  const description = input?.description?.trim();
  const priceNote = input?.priceNote?.trim();
  const imageUrl = input?.imageUrl?.trim();
  if (!Number.isInteger(input?.cityId) || input.cityId < 1 || !title || !description) {
    return { ok: false, formError: "City, title, and description are required." };
  }
  if (!Number.isFinite(input.basePrice) || input.basePrice < 0) {
    return { ok: false, formError: "Enter a valid base price of 0 or more." };
  }
  if (!(["per_person", "per_group", "per_vehicle"] as const).includes(input.priceUnit)) {
    return { ok: false, formError: "Select a valid price unit." };
  }
  if (title.length > 180 || description.length > 6000 || (priceNote?.length ?? 0) > 240) {
    return { ok: false, formError: "One or more excursion fields are too long." };
  }
  if (!validImageUrl(imageUrl)) return { ok: false, formError: "Use a local /path or an https:// image URL." };
  const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, input.cityId));
  if (!city) return { ok: false, formError: "City not found." };
  const [existingList] = await db
    .select({ id: proposalSections.id })
    .from(proposalSections)
    .where(and(eq(proposalSections.proposalId, proposalId), eq(proposalSections.sectionType, "excursionList"), eq(proposalSections.refId, input.cityId)))
    .limit(1);
  const compatibilityError = await validateProposalAndSections(
    proposalId,
    existingList ? ["excursionList"] : ["cityToursDivider", "excursionList"]
  );
  if (compatibilityError) return { ok: false, formError: compatibilityError };
  const cityExcursions = await db.select({ title: excursions.title }).from(excursions).where(eq(excursions.cityId, input.cityId));
  if (cityExcursions.some((excursion) => excursion.title.trim().toLowerCase() === title.toLowerCase())) {
    return { ok: false, formError: "An excursion with this title already exists in the selected city." };
  }

  let excursionId: number;
  try {
    excursionId = db.transaction((transaction) => {
      const excursion = transaction.insert(excursions).values({
        cityId: input.cityId,
        title,
        description,
        basePrice: input.basePrice,
        priceUnit: input.priceUnit,
        priceNote: priceNote || null,
      }).returning({ id: excursions.id }).get();
      if (imageUrl) {
        transaction.insert(excursionImages).values({ excursionId: excursion.id, url: imageUrl, sortOrder: 0 }).run();
      }
      return excursion.id;
    });
  } catch {
    return { ok: false, formError: "The excursion could not be created." };
  }
  return addCatalogExcursionToProposal(proposalId, excursionId);
}

export async function updateCatalogHotelDefault(
  proposalId: number,
  hotelId: number,
  input: CreateCatalogHotelInput
): Promise<CatalogMutationResult> {
  const name = input?.name?.trim();
  const description = input?.description?.trim();
  const room = input?.defaultRoomCategory?.trim();
  const meal = input?.defaultMealPlan?.trim();
  const imageUrl = input?.imageUrl?.trim();
  if (!Number.isInteger(hotelId) || hotelId < 1 || !Number.isInteger(input?.cityId) || input.cityId < 1 || !name || !description || !room || !meal) {
    return { ok: false, formError: "City, name, description, room category, and meal plan are required." };
  }
  if (!validImageUrl(imageUrl)) return { ok: false, formError: "Use a local /path or an https:// image URL." };
  const [hotel, city] = await Promise.all([
    db.select({ id: hotels.id }).from(hotels).where(eq(hotels.id, hotelId)).then((rows) => rows[0]),
    db.select({ id: cities.id }).from(cities).where(eq(cities.id, input.cityId)).then((rows) => rows[0]),
  ]);
  if (!hotel || !city) return { ok: false, formError: "Hotel or city not found." };
  const cityHotels = await db.select({ id: hotels.id, name: hotels.name }).from(hotels).where(eq(hotels.cityId, input.cityId));
  if (cityHotels.some((item) => item.id !== hotelId && item.name.trim().toLowerCase() === name.toLowerCase())) {
    return { ok: false, formError: "A hotel with this name already exists in the selected city." };
  }
  const [firstImage] = await db.select({ id: hotelImages.id }).from(hotelImages).where(eq(hotelImages.hotelId, hotelId)).orderBy(asc(hotelImages.sortOrder)).limit(1);
  try {
    db.transaction((transaction) => {
      transaction.update(hotels).set({ cityId: input.cityId, name, description, defaultRoomCategory: room, defaultMealPlan: meal }).where(eq(hotels.id, hotelId)).run();
      if (imageUrl && firstImage) transaction.update(hotelImages).set({ url: imageUrl }).where(eq(hotelImages.id, firstImage.id)).run();
      else if (imageUrl) transaction.insert(hotelImages).values({ hotelId, url: imageUrl, slot: "topRight", sortOrder: 0 }).run();
    });
  } catch {
    return { ok: false, formError: "The catalog default could not be updated." };
  }
  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}

export async function updateCatalogExcursionDefault(
  proposalId: number,
  excursionId: number,
  input: CreateCatalogExcursionInput
): Promise<CatalogMutationResult> {
  const title = input?.title?.trim();
  const description = input?.description?.trim();
  const priceNote = input?.priceNote?.trim();
  const imageUrl = input?.imageUrl?.trim();
  if (!Number.isInteger(excursionId) || excursionId < 1 || !Number.isInteger(input?.cityId) || input.cityId < 1 || !title || !description) {
    return { ok: false, formError: "City, title, and description are required." };
  }
  if (!Number.isFinite(input.basePrice) || input.basePrice < 0) return { ok: false, formError: "Enter a valid base price." };
  if (!(["per_person", "per_group", "per_vehicle"] as const).includes(input.priceUnit)) return { ok: false, formError: "Select a valid price unit." };
  if (!validImageUrl(imageUrl)) return { ok: false, formError: "Use a local /path or an https:// image URL." };
  const [excursion, city] = await Promise.all([
    db.select({ id: excursions.id }).from(excursions).where(eq(excursions.id, excursionId)).then((rows) => rows[0]),
    db.select({ id: cities.id }).from(cities).where(eq(cities.id, input.cityId)).then((rows) => rows[0]),
  ]);
  if (!excursion || !city) return { ok: false, formError: "Excursion or city not found." };
  const cityExcursions = await db.select({ id: excursions.id, title: excursions.title }).from(excursions).where(eq(excursions.cityId, input.cityId));
  if (cityExcursions.some((item) => item.id !== excursionId && item.title.trim().toLowerCase() === title.toLowerCase())) {
    return { ok: false, formError: "An excursion with this title already exists in the selected city." };
  }
  const [firstImage] = await db.select({ id: excursionImages.id }).from(excursionImages).where(eq(excursionImages.excursionId, excursionId)).orderBy(asc(excursionImages.sortOrder)).limit(1);
  try {
    db.transaction((transaction) => {
      transaction.update(excursions).set({ cityId: input.cityId, title, description, basePrice: input.basePrice, priceUnit: input.priceUnit, priceNote: priceNote || null }).where(eq(excursions.id, excursionId)).run();
      if (imageUrl && firstImage) transaction.update(excursionImages).set({ url: imageUrl }).where(eq(excursionImages.id, firstImage.id)).run();
      else if (imageUrl) transaction.insert(excursionImages).values({ excursionId, url: imageUrl, sortOrder: 0 }).run();
    });
  } catch {
    return { ok: false, formError: "The catalog default could not be updated." };
  }
  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}
