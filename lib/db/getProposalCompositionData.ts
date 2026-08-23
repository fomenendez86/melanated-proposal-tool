import { asc, eq } from "drizzle-orm";

import type { ProposalCompositionData } from "@/lib/composition/types";
import type { ProposalSectionType } from "@/lib/designs/types";

import { db } from "./client";
import { proposalSections } from "./schema";
import { VIRTUAL_SECTION_TYPES } from "./virtualSectionTypes";

function sectionLabel(sectionType: string, payload: Record<string, unknown>) {
  if (typeof payload.title === "string" && payload.title.trim()) return payload.title;
  if (typeof payload.message === "string" && payload.message.trim()) return "Thank You";
  if (Array.isArray(payload.titleLines)) {
    const text = payload.titleLines
      .map((line) => typeof line === "object" && line && "text" in line ? String(line.text) : "")
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }
  return sectionType.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

export async function getProposalCompositionData(proposalId: number): Promise<ProposalCompositionData> {
  const rows = await db
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.proposalId, proposalId))
    .orderBy(asc(proposalSections.sortOrder));

  return {
    items: rows
      .filter((row) => !VIRTUAL_SECTION_TYPES.has(row.sectionType))
      .map((row) => {
        const payload = (row.payload ?? {}) as Record<string, unknown>;
        return {
          id: row.id,
          sectionType: row.sectionType as ProposalSectionType,
          sortOrder: row.sortOrder,
          label: sectionLabel(row.sectionType, payload),
          hidden: payload.hidden === true,
          deleted: payload.deleted === true,
          variantId: typeof payload.designVariantId === "string" ? payload.designVariantId : undefined,
        };
      }),
  };
}
