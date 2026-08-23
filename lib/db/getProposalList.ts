import { eq } from "drizzle-orm";

import { DEFAULT_DOCUMENT_DESIGN, getDefaultDocumentDesign, getDocumentDesign } from "@/lib/designs/registry";

import { db } from "./client";
import { formatMoney, getProposalData } from "./getProposalData";
import type { ProposalStatus } from "./proposalStatus";
import { clients, proposalEvents, proposalPricing, proposals } from "./schema";

export interface ProposalListRow {
  id: number;
  proposalNumber: string;
  title: string;
  clientName: string;
  status: ProposalStatus;
  designName: string;
  pageCount: number;
  value: string;
  valueRaw: number | null;
  lastActivityAt: string;
}

// Computes accurate page counts (post-pagination) by running getProposalData
// per row. Fine at this app's single-tenant scale; revisit with a cached
// page_count column if the proposal count ever grows large enough to matter.
export async function getProposalListSummaries(): Promise<ProposalListRow[]> {
  const rows = await db
    .select({
      id: proposals.id,
      proposalNumber: proposals.proposalNumber,
      packageName: proposals.packageName,
      coverTitle: proposals.coverTitle,
      status: proposals.status,
      designId: proposals.designId,
      designVersion: proposals.designVersion,
      updatedAt: proposals.updatedAt,
      clientName: clients.fullName,
      invoiceTotal: proposalPricing.invoiceTotal,
      currency: proposalPricing.currency,
    })
    .from(proposals)
    .leftJoin(clients, eq(clients.id, proposals.leadClientId))
    .leftJoin(proposalPricing, eq(proposalPricing.proposalId, proposals.id));

  const events = await db
    .select({ proposalId: proposalEvents.proposalId, createdAt: proposalEvents.createdAt })
    .from(proposalEvents);
  const lastEventByProposal = new Map<number, Date>();
  for (const event of events) {
    const current = lastEventByProposal.get(event.proposalId);
    if (!current || event.createdAt > current) lastEventByProposal.set(event.proposalId, event.createdAt);
  }

  return Promise.all(
    rows.map(async (row) => {
      const design =
        getDocumentDesign(row.designId ?? DEFAULT_DOCUMENT_DESIGN.id, row.designVersion ?? DEFAULT_DOCUMENT_DESIGN.version) ??
        getDefaultDocumentDesign();
      const data = await getProposalData(row.id);
      const lastEvent = lastEventByProposal.get(row.id);
      const lastActivity = lastEvent && lastEvent > row.updatedAt ? lastEvent : row.updatedAt;
      return {
        id: row.id,
        proposalNumber: row.proposalNumber,
        title: row.packageName ?? row.coverTitle,
        clientName: row.clientName ?? "Client not assigned",
        status: row.status,
        designName: design.name,
        pageCount: data.sections.length,
        value: row.invoiceTotal != null ? formatMoney(row.invoiceTotal, row.currency ?? "USD") : "—",
        valueRaw: row.invoiceTotal,
        lastActivityAt: lastActivity.toISOString(),
      };
    })
  );
}
