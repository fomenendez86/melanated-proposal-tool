"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { CompositionMutationResult } from "@/lib/composition/types";
import { db } from "@/lib/db/client";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { proposalSections, proposals } from "@/lib/db/schema";
import type { ProposalSectionType } from "@/lib/designs/types";

const VIRTUAL_TYPES = new Set(["documentDesign", "fromOwnersOverride", "pdfGeneration", "proposalRevision", "shareSettings", "proposalLifecycleEvent", "proposalApproval"]);

async function proposalRows(proposalId: number) {
  return db.select().from(proposalSections).where(eq(proposalSections.proposalId, proposalId)).orderBy(asc(proposalSections.sortOrder));
}

async function verifiedSection(proposalId: number, sectionId: number) {
  const [proposal, section] = await Promise.all([
    db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId)).then((rows) => rows[0]),
    db.select().from(proposalSections).where(and(eq(proposalSections.id, sectionId), eq(proposalSections.proposalId, proposalId))).then((rows) => rows[0]),
  ]);
  return proposal && section && !VIRTUAL_TYPES.has(section.sectionType) ? section : null;
}

function revalidateProposal(proposalId: number) {
  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
}

export async function moveProposalSection(proposalId: number, sectionId: number, direction: -1 | 1): Promise<CompositionMutationResult> {
  const section = await verifiedSection(proposalId, sectionId);
  if (!section || (direction !== -1 && direction !== 1)) return { ok: false, formError: "Section not found." };
  const rows = (await proposalRows(proposalId)).filter((row) => !VIRTUAL_TYPES.has(row.sectionType));
  const index = rows.findIndex((row) => row.id === sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.length) return { ok: false, formError: "The section cannot move farther." };
  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  try {
    db.transaction((transaction) => {
      reordered.forEach((row, order) => transaction.update(proposalSections).set({ sortOrder: (order + 1) * 10 }).where(and(eq(proposalSections.id, row.id), eq(proposalSections.proposalId, proposalId))).run());
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The section could not be moved." };
  }
  revalidateProposal(proposalId);
  return { ok: true };
}

async function setSectionFlags(proposalId: number, sectionId: number, flags: { hidden?: boolean; deleted?: boolean }): Promise<CompositionMutationResult> {
  const section = await verifiedSection(proposalId, sectionId);
  if (!section) return { ok: false, formError: "Section not found." };
  const payload = { ...((section.payload ?? {}) as Record<string, unknown>), ...flags };
  try {
    db.transaction((transaction) => {
      transaction.update(proposalSections).set({ payload }).where(and(eq(proposalSections.id, sectionId), eq(proposalSections.proposalId, proposalId))).run();
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The section state could not be changed." };
  }
  revalidateProposal(proposalId);
  return { ok: true };
}

export async function setProposalSectionHidden(proposalId: number, sectionId: number, hidden: boolean) {
  return setSectionFlags(proposalId, sectionId, { hidden });
}

export async function setProposalSectionDeleted(proposalId: number, sectionId: number, deleted: boolean) {
  return setSectionFlags(proposalId, sectionId, { deleted, ...(deleted ? { hidden: true } : { hidden: false }) });
}

export async function duplicateProposalSection(proposalId: number, sectionId: number): Promise<CompositionMutationResult> {
  const section = await verifiedSection(proposalId, sectionId);
  if (!section) return { ok: false, formError: "Section not found." };
  const rows = await proposalRows(proposalId);
  try {
    db.transaction((transaction) => {
      rows.filter((row) => row.sortOrder > section.sortOrder).forEach((row) => transaction.update(proposalSections).set({ sortOrder: row.sortOrder + 10 }).where(eq(proposalSections.id, row.id)).run());
      transaction.insert(proposalSections).values({
        proposalId,
        sectionType: section.sectionType,
        sortOrder: section.sortOrder + 1,
        refId: section.refId,
        payload: { ...((section.payload ?? {}) as Record<string, unknown>), hidden: false, deleted: false },
      }).run();
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The section could not be duplicated." };
  }
  revalidateProposal(proposalId);
  return { ok: true };
}

const ADDABLE_DEFAULTS: Partial<Record<ProposalSectionType, Record<string, unknown>>> = {
  triangleDivider: { sectionLabel: "New section", titleLines: [{ text: "Section title", style: "bold" }], imageUrl: "" },
  sectionDivider: { title: "NEW SECTION", subtitle: "Add a supporting line", imageUrl: "" },
  thankYou: { message: "Thank you for traveling with us.", imageUrl: "" },
};

export async function addProposalSection(proposalId: number, sectionType: ProposalSectionType): Promise<CompositionMutationResult> {
  const payload = ADDABLE_DEFAULTS[sectionType];
  if (!payload) return { ok: false, formError: "That section type requires catalog or proposal data before it can be added." };
  const data = await getProposalData(proposalId);
  const design = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));
  if (!design.active.supportedSectionTypes.includes(sectionType)) return { ok: false, formError: `${design.active.name} does not support this section.` };
  const rows = await proposalRows(proposalId);
  const nextOrder = rows.reduce((highest, row) => Math.max(highest, row.sortOrder), 0) + 10;
  try {
    db.transaction((transaction) => {
      transaction.insert(proposalSections).values({ proposalId, sectionType, sortOrder: nextOrder, payload }).run();
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The section could not be added." };
  }
  revalidateProposal(proposalId);
  return { ok: true };
}

export async function updateProposalSectionVariant(proposalId: number, sectionId: number, variantId: string): Promise<CompositionMutationResult> {
  const section = await verifiedSection(proposalId, sectionId);
  if (!section) return { ok: false, formError: "Section not found." };
  const data = await getProposalData(proposalId);
  const context = await getProposalDesignContext(proposalId, data.sections.map((item) => item.type));
  const variants = context.active.sectionVariants[section.sectionType as ProposalSectionType] ?? [];
  if (!variants.some((variant) => variant.id === variantId)) return { ok: false, formError: "That layout variant is not available for this section." };
  const payload = { ...((section.payload ?? {}) as Record<string, unknown>), designVariantId: variantId };
  try {
    db.transaction((transaction) => {
      transaction.update(proposalSections).set({ payload }).where(and(eq(proposalSections.id, sectionId), eq(proposalSections.proposalId, proposalId))).run();
      transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The layout variant could not be saved." };
  }
  revalidateProposal(proposalId);
  return { ok: true };
}
