import { and, eq } from "drizzle-orm";

import type { SharedProposalRecord } from "@/lib/sharing/types";

import { db } from "./client";
import { nextProposalStatus } from "./proposalStatus";
import { proposalEvents, proposalRevisions, proposalShares, proposals } from "./schema";
import { createProposalNotification } from "@/lib/notifications/service";

export function shareCookieName(token: string) {
  return `proposal_share_${token.slice(0, 16)}`;
}

export function isSharedProposalExpired(expiresAt: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() < Date.now());
}

export async function getSharedProposal(token: string): Promise<SharedProposalRecord | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const [row] = await db
    .select({ share: proposalShares, revision: proposalRevisions })
    .from(proposalShares)
    .innerJoin(proposalRevisions, eq(proposalRevisions.id, proposalShares.revisionId))
    .where(eq(proposalShares.token, token))
    .limit(1);
  // A revoked share behaves like an unknown token — there's no UI to set
  // revokedAt yet (that's Fase 12.2), but a future revoke path shouldn't
  // leak whether a token ever existed.
  if (!row || row.share.revokedAt) return null;
  return row;
}

export async function recordShareEvent(
  proposalId: number,
  shareId: number,
  event: "opened" | "approved",
  metadata?: Record<string, unknown>
) {
  const [priorOpen] = event === "opened" ? await db.select({ id: proposalEvents.id }).from(proposalEvents).where(and(eq(proposalEvents.shareId, shareId), eq(proposalEvents.type, "opened"))).limit(1) : [];
  await db.insert(proposalEvents).values({
    proposalId,
    shareId,
    type: event,
    metadata: metadata ?? null,
  });
  if (event === "opened") {
    if (!priorOpen) await createProposalNotification({ proposalId, shareId, type: "first_open", title: "Proposal opened", body: `A client opened share ${shareId} for proposal ${proposalId}.`, dedupeKey: `first-open:${shareId}` });
    const [proposal] = await db.select({ status: proposals.status }).from(proposals).where(eq(proposals.id, proposalId));
    const nextStatus = proposal ? nextProposalStatus(proposal.status, "viewed") : null;
    if (nextStatus) {
      await db.update(proposals).set({ status: nextStatus, updatedAt: new Date() }).where(eq(proposals.id, proposalId));
    }
  }
}
