"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { getProposalData } from "@/lib/db/getProposalData";
import { proposals } from "@/lib/db/schema";
import { getDocumentDesign } from "@/lib/designs/registry";
import type { UpdateProposalDesignResult } from "@/lib/designs/types";

export async function updateProposalDesign(
  proposalId: number,
  input: { designId: string; version: number }
): Promise<UpdateProposalDesignResult> {
  if (
    !Number.isInteger(proposalId) ||
    proposalId < 1 ||
    !input ||
    typeof input.designId !== "string" ||
    !Number.isInteger(input.version)
  ) {
    return { ok: false, formError: "Invalid document design selection." };
  }

  const design = getDocumentDesign(input.designId, input.version);
  if (!design) return { ok: false, formError: "That document design is not available." };

  const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };

  const proposalData = await getProposalData(proposalId);
  const supportedTypes = new Set(design.supportedSectionTypes);
  const unsupportedTypes = [...new Set(
    proposalData.sections.map((section) => section.type).filter((type) => !supportedTypes.has(type))
  )];
  if (unsupportedTypes.length > 0) {
    return {
      ok: false,
      formError: `This design does not support: ${unsupportedTypes.join(", ")}.`,
    };
  }

  try {
    db.transaction((transaction) => {
      transaction
        .update(proposals)
        .set({ designId: design.id, designVersion: design.version, updatedAt: new Date() })
        .where(eq(proposals.id, proposalId))
        .run();
    });
  } catch {
    return { ok: false, formError: "The document design could not be changed. Try again." };
  }

  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true };
}
