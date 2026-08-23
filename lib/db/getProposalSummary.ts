import { eq } from "drizzle-orm";

import type { ProposalStatus } from "./proposalStatus";

import { db } from "./client";
import { clients, proposals } from "./schema";

export interface ProposalSummary {
  id: number;
  proposalNumber: string;
  status: ProposalStatus;
  title: string;
  clientName: string;
  travelDates: string;
  updatedAt: string;
}

export async function getProposalSummary(
  proposalId: number
): Promise<ProposalSummary | undefined> {
  const [row] = await db
    .select({
      id: proposals.id,
      proposalNumber: proposals.proposalNumber,
      status: proposals.status,
      packageName: proposals.packageName,
      coverTitle: proposals.coverTitle,
      clientName: clients.fullName,
      travelDates: proposals.travelDatesLabel,
      updatedAt: proposals.updatedAt,
    })
    .from(proposals)
    .leftJoin(clients, eq(clients.id, proposals.leadClientId))
    .where(eq(proposals.id, proposalId));

  if (!row) return undefined;

  return {
    id: row.id,
    proposalNumber: row.proposalNumber,
    status: row.status,
    title: row.packageName ?? row.coverTitle,
    clientName: row.clientName ?? "Client not assigned",
    travelDates: row.travelDates ?? "Dates not assigned",
    updatedAt: row.updatedAt.toISOString(),
  };
}
