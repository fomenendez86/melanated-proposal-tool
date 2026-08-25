import { asc, isNull } from "drizzle-orm";

import type { ContentLibraryData } from "@/lib/library/types";

import { db } from "./client";
import { libraryFees, libraryImages, librarySections, librarySnippets } from "./schema";

export async function getContentLibrary(): Promise<ContentLibraryData> {
  const [sectionRows, snippetRows, imageRows, feeRows] = await Promise.all([
    db.select().from(librarySections).where(isNull(librarySections.archivedAt)).orderBy(asc(librarySections.name)),
    db.select().from(librarySnippets).where(isNull(librarySnippets.archivedAt)).orderBy(asc(librarySnippets.name)),
    db.select().from(libraryImages).where(isNull(libraryImages.archivedAt)).orderBy(asc(libraryImages.name)),
    db.select().from(libraryFees).where(isNull(libraryFees.archivedAt)).orderBy(asc(libraryFees.name)),
  ]);

  return {
    sections: sectionRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sectionType: row.sectionType as ContentLibraryData["sections"][number]["sectionType"],
      payload: row.payload,
      variantId: row.variantId,
      tags: row.tags,
    })),
    snippets: snippetRows.map((row) => ({ id: row.id, name: row.name, body: row.body, tags: row.tags })),
    images: imageRows.map((row) => ({
      id: row.id,
      name: row.name,
      originalName: row.originalName,
      url: `/api/library/images/${row.storageKey}`,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      tags: row.tags,
    })),
    fees: feeRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      unitPriceMinor: row.unitPriceMinor,
      currency: row.currency,
      unit: row.unit,
      taxRateBps: row.taxRateBps,
    })),
  };
}
