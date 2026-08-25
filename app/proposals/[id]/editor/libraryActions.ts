"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { resolveInsertionOrders } from "@/lib/composition/insertionOrder";
import { db } from "@/lib/db/client";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import {
  libraryFees,
  libraryImages,
  librarySections,
  librarySnippets,
  proposalSections,
  proposals,
} from "@/lib/db/schema";
import { VIRTUAL_SECTION_TYPES } from "@/lib/db/virtualSectionTypes";
import type { ProposalSectionType } from "@/lib/designs/types";
import type {
  LibraryMutationResult,
  SaveLibraryFeeInput,
  SaveLibrarySectionInput,
  SaveLibrarySnippetInput,
} from "@/lib/library/types";

function cleanTags(tags: string[] | undefined) {
  return [...new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
}

function validTags(tags: string[]) {
  return tags.every((tag) => tag.length <= 40);
}

function revalidateEditor(proposalId: number) {
  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
}

async function validProposal(proposalId: number) {
  if (!Number.isInteger(proposalId) || proposalId < 1) return false;
  const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId));
  return Boolean(proposal);
}

export async function saveProposalSectionToLibrary(
  proposalId: number,
  sectionId: number,
  input: SaveLibrarySectionInput
): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const name = input?.name?.trim();
  const description = input?.description?.trim();
  const tags = cleanTags(input?.tags);
  if (!name || name.length > 120 || (description?.length ?? 0) > 500 || !validTags(tags)) {
    return { ok: false, formError: "Enter a name under 120 characters and valid tags." };
  }
  if (!Number.isInteger(proposalId) || proposalId < 1 || !Number.isInteger(sectionId) || sectionId < 1) {
    return { ok: false, formError: "Invalid section selection." };
  }
  const [section] = await db
    .select()
    .from(proposalSections)
    .where(and(eq(proposalSections.id, sectionId), eq(proposalSections.proposalId, proposalId)));
  if (!section || VIRTUAL_SECTION_TYPES.has(section.sectionType)) {
    return { ok: false, formError: "This section cannot be saved to the library." };
  }
  if (section.refId != null) {
    return { ok: false, formError: "Catalog-backed sections are already reusable from Catalog." };
  }
  const payload = { ...((section.payload ?? {}) as Record<string, unknown>) };
  delete payload.hidden;
  delete payload.deleted;
  const variantId = typeof payload.designVariantId === "string" ? payload.designVariantId : null;

  try {
    const saved = db
      .insert(librarySections)
      .values({
        name,
        description: description || null,
        sectionType: section.sectionType,
        payload,
        variantId,
        tags,
      })
      .returning({ id: librarySections.id })
      .get();
    revalidateEditor(proposalId);
    return { ok: true, id: saved.id };
  } catch {
    return { ok: false, formError: "The section could not be saved." };
  }
}

export async function insertLibrarySection(
  proposalId: number,
  librarySectionId: number,
  afterSectionId?: number | null
): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId)) || !Number.isInteger(librarySectionId) || librarySectionId < 1) {
    return { ok: false, formError: "Invalid library section." };
  }
  const [saved, sectionRows, data] = await Promise.all([
    db
      .select()
      .from(librarySections)
      .where(and(eq(librarySections.id, librarySectionId), isNull(librarySections.archivedAt)))
      .then((rows) => rows[0]),
    db
      .select({ id: proposalSections.id, sortOrder: proposalSections.sortOrder })
      .from(proposalSections)
      .where(eq(proposalSections.proposalId, proposalId)),
    getProposalData(proposalId),
  ]);
  if (!saved) return { ok: false, formError: "Library section not found." };
  const sectionType = saved.sectionType as ProposalSectionType;
  const design = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));
  if (!design.active.supportedSectionTypes.includes(sectionType)) {
    return { ok: false, formError: `${design.active.name} does not support ${saved.sectionType}.` };
  }
  const resolved = resolveInsertionOrders(sectionRows, afterSectionId, 1);
  if (!resolved) return { ok: false, formError: "That insertion position no longer exists." };
  const supportsVariant = saved.variantId
    ? (design.active.sectionVariants[sectionType] ?? []).some((variant) => variant.id === saved.variantId)
    : false;
  const payload: Record<string, unknown> = { ...saved.payload, hidden: false, deleted: false };
  if (supportsVariant) payload.designVariantId = saved.variantId;
  else delete payload.designVariantId;

  try {
    db.transaction((transaction) => {
      resolved.shifts.forEach((shift) =>
        transaction
          .update(proposalSections)
          .set({ sortOrder: shift.sortOrder })
          .where(and(eq(proposalSections.id, shift.id), eq(proposalSections.proposalId, proposalId)))
          .run()
      );
      transaction.insert(proposalSections).values({
        proposalId,
        sectionType,
        sortOrder: resolved.orders[0],
        payload,
      }).run();
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The saved section could not be inserted." };
  }
  revalidateEditor(proposalId);
  return { ok: true };
}

export async function archiveLibrarySection(proposalId: number, id: number): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId)) || !Number.isInteger(id) || id < 1) return { ok: false, formError: "Invalid section." };
  db.update(librarySections).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(librarySections.id, id)).run();
  revalidateEditor(proposalId);
  return { ok: true };
}

export async function createLibrarySnippet(
  proposalId: number,
  input: SaveLibrarySnippetInput
): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId))) return { ok: false, formError: "Proposal not found." };
  const name = input?.name?.trim();
  const body = input?.body?.trim();
  const tags = cleanTags(input?.tags);
  if (!name || !body || name.length > 120 || body.length > 12000 || !validTags(tags)) {
    return { ok: false, formError: "Name and snippet text are required and must fit the allowed length." };
  }
  const saved = db.insert(librarySnippets).values({ name, body, tags }).returning({ id: librarySnippets.id }).get();
  revalidateEditor(proposalId);
  return { ok: true, id: saved.id };
}

export async function archiveLibrarySnippet(proposalId: number, id: number): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId)) || !Number.isInteger(id) || id < 1) return { ok: false, formError: "Invalid snippet." };
  db.update(librarySnippets).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(librarySnippets.id, id)).run();
  revalidateEditor(proposalId);
  return { ok: true };
}

export async function saveLibraryFee(proposalId: number, id: number | null, input: SaveLibraryFeeInput): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId))) return { ok: false, formError: "Proposal not found." };
  const name = input?.name?.trim();
  const description = input?.description?.trim();
  const currency = input?.currency?.trim().toUpperCase();
  if (!name || name.length > 160 || (description?.length ?? 0) > 1000 || !/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, formError: "Enter a valid name, description, and three-letter currency." };
  }
  if (!Number.isInteger(input.unitPriceMinor) || input.unitPriceMinor < 0 || !Number.isInteger(input.taxRateBps) || input.taxRateBps < 0 || input.taxRateBps > 10000) {
    return { ok: false, formError: "Price and tax must be valid non-negative values." };
  }
  if (!("flat,per_person,per_night,per_vehicle".split(",") as string[]).includes(input.unit)) {
    return { ok: false, formError: "Select a valid fee unit." };
  }
  const values = {
    name,
    description: description || null,
    unitPriceMinor: input.unitPriceMinor,
    currency,
    unit: input.unit,
    taxRateBps: input.taxRateBps,
    updatedAt: new Date(),
  };
  if (id == null) {
    const saved = db.insert(libraryFees).values(values).returning({ id: libraryFees.id }).get();
    revalidateEditor(proposalId);
    return { ok: true, id: saved.id };
  }
  if (!Number.isInteger(id) || id < 1) return { ok: false, formError: "Invalid fee." };
  db.update(libraryFees).set(values).where(eq(libraryFees.id, id)).run();
  revalidateEditor(proposalId);
  return { ok: true, id };
}

export async function archiveLibraryFee(proposalId: number, id: number): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId)) || !Number.isInteger(id) || id < 1) return { ok: false, formError: "Invalid fee." };
  db.update(libraryFees).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(libraryFees.id, id)).run();
  revalidateEditor(proposalId);
  return { ok: true };
}

export async function archiveLibraryImage(proposalId: number, id: number): Promise<LibraryMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validProposal(proposalId)) || !Number.isInteger(id) || id < 1) return { ok: false, formError: "Invalid image." };
  db.update(libraryImages).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(libraryImages.id, id)).run();
  revalidateEditor(proposalId);
  return { ok: true };
}
