import { eq } from "drizzle-orm";

import {
  getDefaultDocumentDesign,
  getDesignChoices,
  getDocumentDesign,
} from "@/lib/designs/registry";
import type { ProposalDesignContext, ProposalSectionType } from "@/lib/designs/types";

import { db } from "./client";
import { proposals } from "./schema";

export async function getProposalDesignContext(
  proposalId: number,
  sectionTypes: ProposalSectionType[]
): Promise<ProposalDesignContext> {
  const [proposal] = await db
    .select({ designId: proposals.designId, designVersion: proposals.designVersion })
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);
  const active = proposal?.designId && proposal.designVersion != null
    ? getDocumentDesign(proposal.designId, proposal.designVersion) ?? getDefaultDocumentDesign()
    : getDefaultDocumentDesign();

  return {
    active: { ...active },
    choices: getDesignChoices(sectionTypes),
  };
}
