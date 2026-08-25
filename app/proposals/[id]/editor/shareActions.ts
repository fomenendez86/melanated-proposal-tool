"use server";

import { randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { syncCommentThreadsForRevision } from "@/lib/db/commentThreads";
import { getProposalDataSnapshot } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { nextProposalStatus } from "@/lib/db/proposalStatus";
import { proposalEvents, proposalRevisions, proposalShares, proposals } from "@/lib/db/schema";
import type { CreateShareResult } from "@/lib/sharing/types";
import { findVariableIssues } from "@/lib/variables/catalog";

export async function createProposalShare(
  proposalId: number,
  input: { password?: string; expiresInDays?: number }
): Promise<CreateShareResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId) || proposalId < 1) return { ok: false, formError: "Invalid proposal." };
  const [proposal] = await db.select({ id: proposals.id, status: proposals.status }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };
  const password = input.password?.trim() ?? "";
  if (password && (password.length < 8 || password.length > 128)) {
    return { ok: false, formError: "Use a password from 8 to 128 characters." };
  }
  const expiresInDays = input.expiresInDays ?? 30;
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
    return { ok: false, formError: "Expiration must be from 1 to 365 days." };
  }

  const snapshot = await getProposalDataSnapshot(proposalId);
  const data = snapshot.resolved;
  const designContext = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));
  const unresolvedRequiredVariables = findVariableIssues(
    snapshot.raw,
    snapshot.variables,
    designContext.active.requiredVariablePaths
  ).filter((issue) => issue.required);
  if (unresolvedRequiredVariables.length > 0) {
    return {
      ok: false,
      formError: `Resolve required variable${unresolvedRequiredVariables.length === 1 ? "" : "s"}: ${unresolvedRequiredVariables.map((issue) => issue.token).join(", ")}.`,
    };
  }
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + expiresInDays * 86_400_000);
  const token = randomBytes(24).toString("hex");
  const salt = password ? randomBytes(16).toString("hex") : undefined;
  const passwordHash = password && salt ? scryptSync(password, salt, 32).toString("hex") : undefined;
  const accessKey = password ? randomBytes(24).toString("hex") : undefined;

  try {
    db.transaction((transaction) => {
      const revision = transaction
        .insert(proposalRevisions)
        .values({
          proposalId,
          designId: designContext.active.id,
          designVersion: designContext.active.version,
          data,
          rawData: snapshot.raw,
          design: designContext.active,
          createdAt,
        })
        .returning({ id: proposalRevisions.id })
        .get();
      const share = transaction
        .insert(proposalShares)
        .values({
          proposalId,
          revisionId: revision.id,
          token,
          expiresAt,
          createdAt,
          ...(salt && passwordHash && accessKey ? { passwordSalt: salt, passwordHash, accessKey } : {}),
        })
        .returning({ id: proposalShares.id })
        .get();
      transaction.insert(proposalEvents).values({
        proposalId,
        shareId: share.id,
        type: "shared",
        createdAt,
      }).run();
      syncCommentThreadsForRevision(transaction, proposalId, data.sections);
      const nextStatus = nextProposalStatus(proposal.status, "sent");
      if (nextStatus) {
        transaction.update(proposals).set({ status: nextStatus, updatedAt: createdAt }).where(eq(proposals.id, proposalId)).run();
      }
    });
  } catch {
    return { ok: false, formError: "The share link could not be created." };
  }
  return { ok: true, path: `/share/${token}`, expiresAt: expiresAt.toISOString() };
}
