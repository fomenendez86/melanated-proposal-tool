import { and, eq } from "drizzle-orm";

import {
  getDefaultDocumentDesign,
  getDesignChoices,
  getDocumentDesign,
} from "@/lib/designs/registry";
import type { ProposalDesignContext, ProposalSectionType } from "@/lib/designs/types";

import { db } from "./client";
import { proposalSections } from "./schema";

interface DesignSelectionPayload {
  designId?: string;
  version?: number;
}

export async function getProposalDesignContext(
  proposalId: number,
  sectionTypes: ProposalSectionType[]
): Promise<ProposalDesignContext> {
  const [selection] = await db
    .select({ payload: proposalSections.payload })
    .from(proposalSections)
    .where(
      and(
        eq(proposalSections.proposalId, proposalId),
        eq(proposalSections.sectionType, "documentDesign")
      )
    )
    .limit(1);
  const payload = (selection?.payload ?? {}) as DesignSelectionPayload;
  const active = typeof payload.designId === "string" && Number.isInteger(payload.version)
    ? getDocumentDesign(payload.designId, payload.version!) ?? getDefaultDocumentDesign()
    : getDefaultDocumentDesign();

  return {
    active: { ...active },
    choices: getDesignChoices(sectionTypes),
  };
}
