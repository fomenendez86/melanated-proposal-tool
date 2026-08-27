"use server";

import { eq } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import type { Transaction } from "@/lib/db/client";
import { db } from "@/lib/db/client";
import {
  itineraries,
  itineraryDayActivities,
  itineraryDayImages,
  itineraryDayParagraphs,
  itineraryDays,
  itineraryExcursions,
  itineraryFlights,
  itineraryHotels,
  itineraryTiers,
  itineraryTransport,
} from "@/lib/db/schema";
import { parseItineraryEditorText } from "@/lib/editor/itineraryEditorCodec";
import type { ItineraryEditorSaveResult } from "@/components/editor/ItineraryEditor";

export interface ItineraryRowMutationResult {
  ok: boolean;
  formError?: string;
  id?: number;
}

function revalidateItinerary(itineraryId: number) {
  revalidatePath(`/proposals/itineraries/${itineraryId}/edit`);
  revalidatePath("/proposals/itineraries");
  // Same reason as the template lists: the dashboard's "New proposal" dialog
  // picks an itinerary from this list, and /proposals is prerendered.
  revalidatePath("/proposals");
}

async function verifyItinerary(itineraryId: number) {
  const [row] = await db.select({ id: itineraries.id }).from(itineraries).where(eq(itineraries.id, itineraryId));
  return Boolean(row);
}

async function verifyTier(itineraryId: number, tierId: number) {
  const [row] = await db.select({ id: itineraryTiers.id }).from(itineraryTiers).where(eq(itineraryTiers.id, tierId));
  return Boolean(row) && (await db.select({ itineraryId: itineraryTiers.itineraryId }).from(itineraryTiers).where(eq(itineraryTiers.id, tierId)))[0]?.itineraryId === itineraryId;
}

// Reorders one row within the "visible for this tier" set (shared rows with
// tierId null, plus rows tagged with the active tier) — a swap-with-neighbor
// followed by renormalizing that visible set's sortOrder to (index+1)*10,
// same convention as moveProposalSection. Only rows in the visible set are
// touched, so reordering under one tier never disturbs another tier's own
// view of a shared row.
function moveScopedRow(
  tx: Transaction,
  table: SQLiteTable,
  idColumn: SQLiteColumn,
  rows: { id: number; sortOrder: number }[],
  rowId: number,
  direction: -1 | 1
): boolean {
  const index = rows.findIndex((row) => row.id === rowId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.length) return false;
  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  reordered.forEach((row, order) => {
    tx.update(table).set({ sortOrder: (order + 1) * 10 }).where(eq(idColumn, row.id)).run();
  });
  return true;
}

function visibleForTier<T extends { tierId: number | null; sortOrder: number }>(rows: T[], activeTierId: number | null): T[] {
  return rows.filter((row) => row.tierId === null || row.tierId === activeTierId).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---------------------------------------------------------------------------
// Days — same replace-everything-from-parsed-text pattern as
// updateProposalFields's "itinerary" kind (app/proposals/[id]/editor/actions.ts),
// against itinerary_days* instead of proposal_days*.
// ---------------------------------------------------------------------------

export async function updateItineraryDays(itineraryId: number, serializedText: string): Promise<ItineraryEditorSaveResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(itineraryId) || !(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  const days = parseItineraryEditorText(serializedText);
  if (!days) return { ok: false, fieldErrors: { itinerarySnapshotText: "Check the day numbering and activity formatting." } };

  try {
    db.transaction((tx) => {
      tx.delete(itineraryDays).where(eq(itineraryDays.itineraryId, itineraryId)).run();
      days.forEach((day, sortOrder) => {
        const insertedDay = tx
          .insert(itineraryDays)
          .values({
            itineraryId,
            dayNumber: day.dayNumber,
            date: day.date || null,
            subtitle: day.subtitle || null,
            highlightLine: day.highlightLine || null,
            sortOrder,
          })
          .returning({ id: itineraryDays.id })
          .get();
        if (day.activities.length > 0) {
          tx.insert(itineraryDayActivities)
            .values(day.activities.map((activity, order) => ({ dayId: insertedDay.id, timeRange: activity.timeRange || null, description: activity.description, sortOrder: order })))
            .run();
        }
        if (day.paragraphs.length > 0) {
          tx.insert(itineraryDayParagraphs).values(day.paragraphs.map((body, order) => ({ dayId: insertedDay.id, body, sortOrder: order }))).run();
        }
        if (day.images.length > 0) {
          tx.insert(itineraryDayImages).values(day.images.map((url, order) => ({ dayId: insertedDay.id, url, sortOrder: order }))).run();
        }
      });
      tx.update(itineraries).set({ updatedAt: new Date() }).where(eq(itineraries.id, itineraryId)).run();
    });
  } catch {
    return { ok: false, formError: "The itinerary days could not be saved." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export async function addItineraryTier(
  itineraryId: number,
  input: { name: string; description?: string; priceMinor?: number; currency?: string }
): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const name = input.name?.trim() ?? "";
  if (!name || name.length > 60) return { ok: false, formError: "Enter a tier name (up to 60 characters)." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  try {
    const existing = await db.select({ id: itineraryTiers.id }).from(itineraryTiers).where(eq(itineraryTiers.itineraryId, itineraryId));
    const inserted = db.transaction((tx) =>
      tx
        .insert(itineraryTiers)
        .values({ itineraryId, name, description: input.description?.trim() || null, priceMinor: input.priceMinor ?? null, currency: input.currency ?? null, sortOrder: existing.length })
        .returning({ id: itineraryTiers.id })
        .get()
    );
    revalidateItinerary(itineraryId);
    return { ok: true, id: inserted.id };
  } catch {
    return { ok: false, formError: "The tier could not be created." };
  }
}

export async function updateItineraryTier(
  itineraryId: number,
  tierId: number,
  input: { name: string; description?: string; priceMinor?: number; currency?: string }
): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const name = input.name?.trim() ?? "";
  if (!name || name.length > 60) return { ok: false, formError: "Enter a tier name (up to 60 characters)." };
  if (!(await verifyTier(itineraryId, tierId))) return { ok: false, formError: "Tier not found." };

  try {
    db.transaction((tx) => {
      tx.update(itineraryTiers)
        .set({ name, description: input.description?.trim() || null, priceMinor: input.priceMinor ?? null, currency: input.currency ?? null })
        .where(eq(itineraryTiers.id, tierId))
        .run();
    });
  } catch {
    return { ok: false, formError: "The tier could not be updated." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

// Deleting a tier cascades (FK onDelete: cascade) its own tier-tagged
// hotel/excursion/flight/transport rows only — shared (tierId null) rows and
// itinerary days are never affected, since neither references tierId.
export async function deleteItineraryTier(itineraryId: number, tierId: number): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyTier(itineraryId, tierId))) return { ok: false, formError: "Tier not found." };

  try {
    db.transaction((tx) => {
      tx.delete(itineraryTiers).where(eq(itineraryTiers.id, tierId)).run();
    });
  } catch {
    return { ok: false, formError: "The tier could not be deleted." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Hotels
// ---------------------------------------------------------------------------

export async function addItineraryHotel(
  itineraryId: number,
  tierId: number | null,
  input: { hotelId: number; roomCategory: string; mealPlan: string; nights: number }
): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };
  if (tierId !== null && !(await verifyTier(itineraryId, tierId))) return { ok: false, formError: "Tier not found." };
  if (!input.roomCategory?.trim() || !input.mealPlan?.trim() || !Number.isInteger(input.nights) || input.nights < 1) {
    return { ok: false, formError: "Enter a room category, meal plan, and number of nights." };
  }

  try {
    const existing = await db.select({ id: itineraryHotels.id }).from(itineraryHotels).where(eq(itineraryHotels.itineraryId, itineraryId));
    const inserted = db.transaction((tx) =>
      tx
        .insert(itineraryHotels)
        .values({ itineraryId, tierId, hotelId: input.hotelId, roomCategory: input.roomCategory.trim(), mealPlan: input.mealPlan.trim(), nights: input.nights, sortOrder: existing.length })
        .returning({ id: itineraryHotels.id })
        .get()
    );
    revalidateItinerary(itineraryId);
    return { ok: true, id: inserted.id };
  } catch {
    return { ok: false, formError: "The hotel could not be added." };
  }
}

export async function removeItineraryHotel(itineraryId: number, rowId: number): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.delete(itineraryHotels).where(eq(itineraryHotels.id, rowId)).run();
    });
  } catch {
    return { ok: false, formError: "The hotel could not be removed." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

export async function moveItineraryHotel(itineraryId: number, activeTierId: number | null, rowId: number, direction: -1 | 1): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  const rows = await db.select().from(itineraryHotels).where(eq(itineraryHotels.itineraryId, itineraryId));
  const visible = visibleForTier(rows, activeTierId);
  try {
    const moved = db.transaction((tx) => moveScopedRow(tx, itineraryHotels, itineraryHotels.id, visible, rowId, direction));
    if (!moved) return { ok: false, formError: "The hotel cannot move farther." };
  } catch {
    return { ok: false, formError: "The hotel could not be moved." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Excursions
// ---------------------------------------------------------------------------

export async function addItineraryExcursion(
  itineraryId: number,
  tierId: number | null,
  input: { excursionId: number; priceOverride?: number }
): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };
  if (tierId !== null && !(await verifyTier(itineraryId, tierId))) return { ok: false, formError: "Tier not found." };

  try {
    const existing = await db.select({ id: itineraryExcursions.id }).from(itineraryExcursions).where(eq(itineraryExcursions.itineraryId, itineraryId));
    const inserted = db.transaction((tx) =>
      tx
        .insert(itineraryExcursions)
        .values({ itineraryId, tierId, excursionId: input.excursionId, priceOverride: input.priceOverride ?? null, sortOrder: existing.length })
        .returning({ id: itineraryExcursions.id })
        .get()
    );
    revalidateItinerary(itineraryId);
    return { ok: true, id: inserted.id };
  } catch {
    return { ok: false, formError: "The excursion could not be added." };
  }
}

export async function removeItineraryExcursion(itineraryId: number, rowId: number): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.delete(itineraryExcursions).where(eq(itineraryExcursions.id, rowId)).run();
    });
  } catch {
    return { ok: false, formError: "The excursion could not be removed." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

export async function moveItineraryExcursion(itineraryId: number, activeTierId: number | null, rowId: number, direction: -1 | 1): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  const rows = await db.select().from(itineraryExcursions).where(eq(itineraryExcursions.itineraryId, itineraryId));
  const visible = visibleForTier(rows, activeTierId);
  try {
    const moved = db.transaction((tx) => moveScopedRow(tx, itineraryExcursions, itineraryExcursions.id, visible, rowId, direction));
    if (!moved) return { ok: false, formError: "The excursion cannot move farther." };
  } catch {
    return { ok: false, formError: "The excursion could not be moved." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Flights — structured, no catalog (confirmed scope).
// ---------------------------------------------------------------------------

export interface ItineraryFlightInput {
  carrier?: string;
  flightNumber?: string;
  originAirport?: string;
  destinationAirport?: string;
  departureAt?: string; // ISO string, optional
  arrivalAt?: string;
  cabinClass?: string;
  costMinor?: number;
  currency?: string;
  notes?: string;
}

export async function addItineraryFlight(itineraryId: number, tierId: number | null, input: ItineraryFlightInput): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };
  if (tierId !== null && !(await verifyTier(itineraryId, tierId))) return { ok: false, formError: "Tier not found." };

  try {
    const existing = await db.select({ id: itineraryFlights.id }).from(itineraryFlights).where(eq(itineraryFlights.itineraryId, itineraryId));
    const inserted = db.transaction((tx) =>
      tx
        .insert(itineraryFlights)
        .values({
          itineraryId,
          tierId,
          carrier: input.carrier?.trim() || null,
          flightNumber: input.flightNumber?.trim() || null,
          originAirport: input.originAirport?.trim() || null,
          destinationAirport: input.destinationAirport?.trim() || null,
          departureAt: input.departureAt ? new Date(input.departureAt) : null,
          arrivalAt: input.arrivalAt ? new Date(input.arrivalAt) : null,
          cabinClass: input.cabinClass?.trim() || null,
          costMinor: input.costMinor ?? null,
          currency: input.currency ?? null,
          notes: input.notes?.trim() || null,
          sortOrder: existing.length,
        })
        .returning({ id: itineraryFlights.id })
        .get()
    );
    revalidateItinerary(itineraryId);
    return { ok: true, id: inserted.id };
  } catch {
    return { ok: false, formError: "The flight could not be added." };
  }
}

export async function removeItineraryFlight(itineraryId: number, rowId: number): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.delete(itineraryFlights).where(eq(itineraryFlights.id, rowId)).run();
    });
  } catch {
    return { ok: false, formError: "The flight could not be removed." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

export async function moveItineraryFlight(itineraryId: number, activeTierId: number | null, rowId: number, direction: -1 | 1): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  const rows = await db.select().from(itineraryFlights).where(eq(itineraryFlights.itineraryId, itineraryId));
  const visible = visibleForTier(rows, activeTierId);
  try {
    const moved = db.transaction((tx) => moveScopedRow(tx, itineraryFlights, itineraryFlights.id, visible, rowId, direction));
    if (!moved) return { ok: false, formError: "The flight cannot move farther." };
  } catch {
    return { ok: false, formError: "The flight could not be moved." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Ground transportation — same treatment as flights.
// ---------------------------------------------------------------------------

export interface ItineraryTransportInput {
  mode?: string;
  description?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  scheduledAt?: string;
  costMinor?: number;
  currency?: string;
}

export async function addItineraryTransport(itineraryId: number, tierId: number | null, input: ItineraryTransportInput): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };
  if (tierId !== null && !(await verifyTier(itineraryId, tierId))) return { ok: false, formError: "Tier not found." };

  try {
    const existing = await db.select({ id: itineraryTransport.id }).from(itineraryTransport).where(eq(itineraryTransport.itineraryId, itineraryId));
    const inserted = db.transaction((tx) =>
      tx
        .insert(itineraryTransport)
        .values({
          itineraryId,
          tierId,
          mode: input.mode?.trim() || null,
          description: input.description?.trim() || null,
          vehicleType: input.vehicleType?.trim() || null,
          pickupLocation: input.pickupLocation?.trim() || null,
          dropoffLocation: input.dropoffLocation?.trim() || null,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          costMinor: input.costMinor ?? null,
          currency: input.currency ?? null,
          sortOrder: existing.length,
        })
        .returning({ id: itineraryTransport.id })
        .get()
    );
    revalidateItinerary(itineraryId);
    return { ok: true, id: inserted.id };
  } catch {
    return { ok: false, formError: "The transportation entry could not be added." };
  }
}

export async function removeItineraryTransport(itineraryId: number, rowId: number): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.delete(itineraryTransport).where(eq(itineraryTransport.id, rowId)).run();
    });
  } catch {
    return { ok: false, formError: "The transportation entry could not be removed." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}

export async function moveItineraryTransport(itineraryId: number, activeTierId: number | null, rowId: number, direction: -1 | 1): Promise<ItineraryRowMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await verifyItinerary(itineraryId))) return { ok: false, formError: "Itinerary not found." };

  const rows = await db.select().from(itineraryTransport).where(eq(itineraryTransport.itineraryId, itineraryId));
  const visible = visibleForTier(rows, activeTierId);
  try {
    const moved = db.transaction((tx) => moveScopedRow(tx, itineraryTransport, itineraryTransport.id, visible, rowId, direction));
    if (!moved) return { ok: false, formError: "The transportation entry cannot move farther." };
  } catch {
    return { ok: false, formError: "The transportation entry could not be moved." };
  }
  revalidateItinerary(itineraryId);
  return { ok: true };
}
