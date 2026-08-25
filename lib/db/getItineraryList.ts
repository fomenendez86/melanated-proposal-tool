import { eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { itineraries, itineraryDays, itineraryTiers } from "./schema";

export interface ItineraryListRow {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  destinationLabel: string | null;
  dayCount: number;
  tierNames: string[];
  archived: boolean;
  updatedAt: string;
}

// Leaner than a real proposal query — itineraries have no design, client,
// or pricing to join, same "lighter query" philosophy as getTemplateList.
export async function getItineraryList(): Promise<ItineraryListRow[]> {
  const rows = await db.select().from(itineraries);

  const result: ItineraryListRow[] = [];
  for (const row of rows) {
    const days = await db.select({ id: itineraryDays.id }).from(itineraryDays).where(eq(itineraryDays.itineraryId, row.id));
    const tiers = await db
      .select({ name: itineraryTiers.name })
      .from(itineraryTiers)
      .where(eq(itineraryTiers.itineraryId, row.id))
      .orderBy(itineraryTiers.sortOrder);
    result.push({
      id: row.id,
      name: row.name,
      description: row.description,
      thumbnailUrl: row.thumbnailUrl,
      destinationLabel: row.destinationLabel,
      dayCount: days.length,
      tierNames: tiers.map((tier) => tier.name),
      archived: row.archivedAt !== null,
      updatedAt: row.updatedAt.toISOString(),
    });
  }
  return result;
}

export interface ItineraryPickerRow {
  id: number;
  name: string;
  tiers: { id: number; name: string }[];
}

// Feeds CreateProposalDialog's "From itinerary" origin picker.
export async function getItineraryPickerList(): Promise<ItineraryPickerRow[]> {
  const rows = await db.select().from(itineraries).where(isNull(itineraries.archivedAt));
  const result: ItineraryPickerRow[] = [];
  for (const row of rows) {
    const tiers = await db
      .select({ id: itineraryTiers.id, name: itineraryTiers.name })
      .from(itineraryTiers)
      .where(eq(itineraryTiers.itineraryId, row.id))
      .orderBy(itineraryTiers.sortOrder);
    result.push({ id: row.id, name: row.name, tiers });
  }
  return result;
}
