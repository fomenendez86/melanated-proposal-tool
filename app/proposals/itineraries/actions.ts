"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { duplicateItinerary as duplicateItineraryGraph } from "@/lib/db/duplicateItinerary";
import { itineraries } from "@/lib/db/schema";

export interface ItineraryMutationResult {
  ok: boolean;
  formError?: string;
  id?: number;
}

function revalidateItineraries() {
  revalidatePath("/proposals/itineraries");
  // Same reason as the template lists: the dashboard's "New proposal" dialog
  // picks an itinerary from this list, and /proposals is prerendered.
  revalidatePath("/proposals");
}

async function getItineraryRow(itineraryId: number) {
  const [row] = await db.select({ id: itineraries.id }).from(itineraries).where(eq(itineraries.id, itineraryId));
  return row;
}

export async function createItinerary(input: { name: string; description?: string; destinationLabel?: string }): Promise<ItineraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const name = input.name?.trim() ?? "";
  if (!name || name.length > 120) return { ok: false, formError: "Enter an itinerary name (up to 120 characters)." };
  const description = input.description?.trim() || null;
  if (description && description.length > 500) return { ok: false, formError: "Description is too long." };
  const destinationLabel = input.destinationLabel?.trim() || null;

  try {
    const inserted = db.transaction((tx) =>
      tx.insert(itineraries).values({ name, description, destinationLabel }).returning({ id: itineraries.id }).get()
    );
    revalidateItineraries();
    return { ok: true, id: inserted.id };
  } catch {
    return { ok: false, formError: "The itinerary could not be created." };
  }
}

export async function updateItineraryFields(
  itineraryId: number,
  input: { name: string; description?: string; destinationLabel?: string; thumbnailUrl?: string }
): Promise<ItineraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(itineraryId)) return { ok: false, formError: "Itinerary not found." };
  const name = input.name?.trim() ?? "";
  if (!name || name.length > 120) return { ok: false, formError: "Enter an itinerary name (up to 120 characters)." };
  const description = input.description?.trim() || null;
  if (description && description.length > 500) return { ok: false, formError: "Description is too long." };

  const row = await getItineraryRow(itineraryId);
  if (!row) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.update(itineraries)
        .set({
          name,
          description,
          destinationLabel: input.destinationLabel?.trim() || null,
          thumbnailUrl: input.thumbnailUrl?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, itineraryId))
        .run();
    });
  } catch {
    return { ok: false, formError: "The itinerary could not be updated." };
  }
  revalidateItineraries();
  return { ok: true };
}

export async function archiveItinerary(itineraryId: number): Promise<ItineraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(itineraryId)) return { ok: false, formError: "Itinerary not found." };
  const row = await getItineraryRow(itineraryId);
  if (!row) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.update(itineraries).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(itineraries.id, itineraryId)).run();
    });
  } catch {
    return { ok: false, formError: "The itinerary could not be archived." };
  }
  revalidateItineraries();
  return { ok: true };
}

export async function restoreItinerary(itineraryId: number): Promise<ItineraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(itineraryId)) return { ok: false, formError: "Itinerary not found." };
  const row = await getItineraryRow(itineraryId);
  if (!row) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.update(itineraries).set({ archivedAt: null, updatedAt: new Date() }).where(eq(itineraries.id, itineraryId)).run();
    });
  } catch {
    return { ok: false, formError: "The itinerary could not be restored." };
  }
  revalidateItineraries();
  return { ok: true };
}

// Hard delete is safe here (unlike proposals/templates): nothing keeps a
// live FK back to an itinerary after "Generate proposal" — the graph copy
// is fully independent, so deleting the source itinerary never orphans a
// proposal that was generated from it.
export async function deleteItinerary(itineraryId: number): Promise<ItineraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(itineraryId)) return { ok: false, formError: "Itinerary not found." };
  const row = await getItineraryRow(itineraryId);
  if (!row) return { ok: false, formError: "Itinerary not found." };

  try {
    db.transaction((tx) => {
      tx.delete(itineraries).where(eq(itineraries.id, itineraryId)).run();
    });
  } catch {
    return { ok: false, formError: "The itinerary could not be deleted." };
  }
  revalidateItineraries();
  return { ok: true };
}

export async function duplicateItinerary(itineraryId: number): Promise<ItineraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(itineraryId)) return { ok: false, formError: "Itinerary not found." };
  const result = await duplicateItineraryGraph(itineraryId);
  if (result.ok) revalidateItineraries();
  return result;
}
