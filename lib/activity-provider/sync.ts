import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  cities,
  countries,
  destinations,
  excursionImages,
  excursionProviderData,
  excursions,
} from "@/lib/db/schema";

import { getActiveProviderProductIds, getProviderActivity, getProviderActivityPlaces } from "./client";
import { getActivityProviderConfig } from "./config";
import { normalizeProviderActivity } from "./normalize";
import type { ActivityProviderSyncResult, NormalizedProviderExcursion } from "./types";

function normalized(value: string | undefined) {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await work(items[index]);
    }
  }));
  return results;
}

async function resolveCityId(item: NormalizedProviderExcursion): Promise<number> {
  const rows = await db
    .select({
      cityId: cities.id,
      cityName: cities.name,
      destinationId: destinations.id,
      countryId: countries.id,
      countryName: countries.name,
      countryCode: countries.code,
    })
    .from(cities)
    .innerJoin(destinations, eq(destinations.id, cities.destinationId))
    .innerJoin(countries, eq(countries.id, destinations.countryId));

  const cityName = item.cityName?.trim() || "Unassigned";
  const countryCode = item.countryCode?.trim().toUpperCase();
  const exact = rows.find((row) => normalized(row.cityName) === normalized(cityName)
    && (!countryCode || row.countryCode.toUpperCase() === countryCode));
  if (exact) return exact.cityId;

  let country = rows.find((row) => countryCode && row.countryCode.toUpperCase() === countryCode);
  if (!country && item.countryName) {
    country = rows.find((row) => normalized(row.countryName) === normalized(item.countryName));
  }

  let countryId = country?.countryId;
  if (!countryId) {
    const inserted = await db
      .insert(countries)
      .values({ name: item.countryName?.trim() || "Unassigned", code: countryCode || "XX" })
      .returning({ id: countries.id });
    countryId = inserted[0]!.id;
  }

  const [existingDestination] = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.countryId, countryId))
    .limit(1);
  const destinationId = existingDestination?.id ?? (await db
    .insert(destinations)
    .values({ countryId, name: `${item.countryName?.trim() || "Unassigned"} activities` })
    .returning({ id: destinations.id }))[0]!.id;

  const insertedCity = await db
    .insert(cities)
    .values({ destinationId, name: cityName })
    .returning({ id: cities.id });
  return insertedCity[0]!.id;
}

function providerValues(item: NormalizedProviderExcursion, excursionId: number, syncedAt: Date) {
  return {
    excursionId,
    providerProductId: item.providerProductId,
    providerProductCode: item.providerProductCode ?? null,
    slug: item.slug ?? null,
    active: item.published,
    providerModifiedAt: item.providerModifiedAt ?? null,
    syncedAt,
    excerpt: item.excerpt ?? null,
    durationText: item.durationText ?? null,
    durationMinutes: item.durationMinutes ?? null,
    bookingType: item.bookingType ?? null,
    capacityType: item.capacityType ?? null,
    meetingType: item.meetingType ?? null,
    minAge: item.minAge ?? null,
    difficultyLevel: item.difficultyLevel ?? null,
    privateActivity: item.privateActivity,
    pickupAvailable: item.pickupAvailable,
    customPickupAllowed: item.customPickupAllowed,
    dropoffAvailable: item.dropoffAvailable,
    customDropoffAllowed: item.customDropoffAllowed,
    bookingCutoffMinutes: item.bookingCutoffMinutes ?? null,
    requestDeadlineMinutes: item.requestDeadlineMinutes ?? null,
    requirements: item.requirements ?? null,
    attention: item.attention ?? null,
    included: item.included ?? null,
    excluded: item.excluded ?? null,
    mainContactFields: item.mainContactFields,
    passengerFields: item.passengerFields,
    bookingQuestions: item.bookingQuestions,
    pricingCategories: item.pricingCategories,
    rates: item.rates,
    pickupPlaces: item.pickupPlaces,
    dropoffPlaces: item.dropoffPlaces,
    startTimes: item.startTimes,
    extras: item.extras,
  };
}

async function upsertExcursion(item: NormalizedProviderExcursion, syncedAt: Date): Promise<"created" | "updated" | "matched"> {
  const cityId = await resolveCityId(item);
  const [linked] = await db
    .select({ id: excursionProviderData.id, excursionId: excursionProviderData.excursionId })
    .from(excursionProviderData)
    .where(eq(excursionProviderData.providerProductId, item.providerProductId))
    .limit(1);

  let excursionId = linked?.excursionId;
  let outcome: "created" | "updated" | "matched" = linked ? "updated" : "created";

  if (!excursionId) {
    const candidates = await db
      .select({ id: excursions.id, title: excursions.title, providerId: excursionProviderData.id })
      .from(excursions)
      .leftJoin(excursionProviderData, eq(excursionProviderData.excursionId, excursions.id))
      .where(eq(excursions.cityId, cityId));
    const match = candidates.find((candidate) => !candidate.providerId && normalized(candidate.title) === normalized(item.title));
    if (match) {
      excursionId = match.id;
      outcome = "matched";
    }
  }

  db.transaction((transaction) => {
    if (!excursionId) {
      excursionId = transaction
        .insert(excursions)
        .values({
          cityId,
          title: item.title,
          description: item.description,
          basePrice: item.basePrice,
          currency: item.currency,
          priceUnit: item.priceUnit,
          priceNote: item.priceNote ?? null,
        })
        .returning({ id: excursions.id })
        .get().id;
    } else {
      transaction
        .update(excursions)
        .set({
          cityId,
          title: item.title,
          description: item.description,
          basePrice: item.basePrice,
          currency: item.currency,
          priceUnit: item.priceUnit,
          priceNote: item.priceNote ?? null,
        })
        .where(eq(excursions.id, excursionId))
        .run();
    }

    const values = providerValues(item, excursionId, syncedAt);
    if (linked) {
      transaction.update(excursionProviderData).set(values).where(eq(excursionProviderData.id, linked.id)).run();
    } else {
      transaction.insert(excursionProviderData).values(values).run();
    }

    if (item.images.length > 0) {
      transaction.delete(excursionImages).where(eq(excursionImages.excursionId, excursionId)).run();
      transaction.insert(excursionImages).values(item.images.map((image, index) => ({
        excursionId: excursionId!,
        url: image.url,
        altText: image.altText ?? null,
        providerPhotoId: image.providerPhotoId ?? null,
        sortOrder: index,
      }))).run();
    }
  });

  return outcome;
}

export async function syncExcursionsFromActivityProvider(): Promise<ActivityProviderSyncResult> {
  const config = getActivityProviderConfig();
  const productIds = await getActiveProviderProductIds();
  const activeProductIds = new Set(productIds);
  const syncedAt = new Date();

  const fetched = await mapWithConcurrency(productIds, 4, async (productId) => {
    try {
      const activity = await getProviderActivity(productId);
      const places = await getProviderActivityPlaces(productId).catch(() => null);
      return { item: normalizeProviderActivity(activity, places, config.currency) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown activity provider error." };
    }
  });

  const counts = { created: 0, updated: 0, matched: 0, failed: 0 };
  for (const result of fetched) {
    if (!("item" in result) || !result.item) {
      counts.failed += 1;
      continue;
    }
    try {
      counts[await upsertExcursion(result.item, syncedAt)] += 1;
    } catch {
      counts.failed += 1;
    }
  }

  const currentRows = await db.select().from(excursionProviderData);
  const staleRows = currentRows.filter((row) => row.active && !activeProductIds.has(row.providerProductId));
  for (const row of staleRows) {
    await db
      .update(excursionProviderData)
      .set({ active: false, syncedAt })
      .where(and(eq(excursionProviderData.id, row.id), eq(excursionProviderData.providerProductId, row.providerProductId)));
  }

  const succeeded = counts.created + counts.updated + counts.matched;
  return {
    ok: productIds.length === 0 || succeeded > 0,
    ...counts,
    deactivated: staleRows.length,
    total: productIds.length,
    syncedAt: syncedAt.toISOString(),
    formError: productIds.length > 0 && succeeded === 0
      ? "No activity products could be synchronized. Check the provider credentials and product data."
      : counts.failed > 0
        ? `${counts.failed} activity product${counts.failed === 1 ? "" : "s"} could not be synchronized.`
        : undefined,
  };
}
