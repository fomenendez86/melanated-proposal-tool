import { eq } from "drizzle-orm";

import { DEFAULT_DOCUMENT_DESIGN, getDefaultDocumentDesign, getDocumentDesign } from "@/lib/designs/registry";

import { db } from "./client";
import type { ProposalStatus } from "./proposalStatus";
import { proposals } from "./schema";

export interface TemplateListRow {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  designName: string;
  status: Extract<ProposalStatus, "draft" | "archived">;
  updatedAt: string;
}

// Leaner than getProposalListSummaries — templates never show pricing,
// last-activity, or a real page count, so this skips those joins entirely.
export async function getTemplateList(): Promise<TemplateListRow[]> {
  const rows = await db
    .select({
      id: proposals.id,
      templateName: proposals.templateName,
      coverTitle: proposals.coverTitle,
      templateDescription: proposals.templateDescription,
      templateThumbnailUrl: proposals.templateThumbnailUrl,
      designId: proposals.designId,
      designVersion: proposals.designVersion,
      status: proposals.status,
      updatedAt: proposals.updatedAt,
    })
    .from(proposals)
    .where(eq(proposals.isTemplate, true));

  return rows.map((row) => {
    const design =
      getDocumentDesign(row.designId ?? DEFAULT_DOCUMENT_DESIGN.id, row.designVersion ?? DEFAULT_DOCUMENT_DESIGN.version) ??
      getDefaultDocumentDesign();
    return {
      id: row.id,
      name: row.templateName ?? row.coverTitle,
      description: row.templateDescription,
      thumbnailUrl: row.templateThumbnailUrl,
      designName: design.name,
      status: row.status === "archived" ? "archived" : "draft",
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}
