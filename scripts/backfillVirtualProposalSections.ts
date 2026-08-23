// One-time data migration for Fase 12.1: moves any leftover virtual
// proposal_sections rows (documentDesign, proposalRevision, shareSettings,
// proposalLifecycleEvent, proposalApproval, pdfGeneration) into the real
// tables/columns that replaced them, then deletes the old rows.
// fromOwnersOverride is untouched — it stays a virtual row (out of scope).
//
// Safe to run against a database with none of these rows (a no-op) — the
// dev database had zero as of the migration that added the new tables.
// Run once via `npx tsx scripts/backfillVirtualProposalSections.ts`.

import { eq } from "drizzle-orm";

import type { DocumentDesignDescriptor } from "../lib/designs/types";
import type { ProposalData } from "../lib/types";

import { db } from "../lib/db/client";
import {
  proposalEvents,
  proposalRevisions,
  proposalSections,
  proposalShares,
  proposals,
} from "../lib/db/schema";

interface DocumentDesignPayload {
  designId?: string;
  version?: number;
}

interface ProposalRevisionPayload {
  proposalId: number;
  createdAt: string;
  data: ProposalData;
  design: DocumentDesignDescriptor;
}

interface ProposalShareSettingsPayload {
  token: string;
  revisionSectionId: number;
  createdAt: string;
  expiresAt: string | null;
  passwordSalt?: string;
  passwordHash?: string;
  accessKey?: string;
}

interface ProposalLifecycleEventPayload {
  token: string;
  event: "shared" | "opened" | "approved";
  occurredAt: string;
}

interface ProposalApprovalPayload {
  token: string;
  name: string;
  email: string | null;
  approvedAt: string;
}

async function main() {
  const rows = await db.select().from(proposalSections);

  const designRows = rows.filter((row) => row.sectionType === "documentDesign");
  const revisionRows = rows.filter((row) => row.sectionType === "proposalRevision");
  const shareRows = rows.filter((row) => row.sectionType === "shareSettings");
  const lifecycleRows = rows.filter((row) => row.sectionType === "proposalLifecycleEvent");
  const approvalRows = rows.filter((row) => row.sectionType === "proposalApproval");
  const pdfRows = rows.filter((row) => row.sectionType === "pdfGeneration");

  const migratedCount = designRows.length + revisionRows.length + shareRows.length
    + lifecycleRows.length + approvalRows.length + pdfRows.length;
  if (migratedCount === 0) {
    console.info(JSON.stringify({ event: "backfill_skipped", reason: "no_virtual_rows_found" }));
    return;
  }

  db.transaction((transaction) => {
    for (const row of designRows) {
      const payload = row.payload as DocumentDesignPayload | null;
      if (payload?.designId && Number.isInteger(payload.version)) {
        transaction
          .update(proposals)
          .set({ designId: payload.designId, designVersion: payload.version })
          .where(eq(proposals.id, row.proposalId))
          .run();
      }
      transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
    }

    // old proposal_sections.id -> new proposal_revisions.id
    const revisionIdMap = new Map<number, number>();
    for (const row of revisionRows) {
      const payload = row.payload as ProposalRevisionPayload;
      const inserted = transaction
        .insert(proposalRevisions)
        .values({
          proposalId: row.proposalId,
          designId: payload.design.id,
          designVersion: payload.design.version,
          data: payload.data,
          design: payload.design,
          createdAt: new Date(payload.createdAt),
        })
        .returning({ id: proposalRevisions.id })
        .get();
      revisionIdMap.set(row.id, inserted.id);
      transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
    }

    // share token -> new proposal_shares.id (for resolving lifecycle/approval events)
    const shareIdByToken = new Map<string, number>();
    for (const row of shareRows) {
      const payload = row.payload as ProposalShareSettingsPayload;
      const revisionId = revisionIdMap.get(payload.revisionSectionId);
      if (!revisionId) {
        console.warn(JSON.stringify({ event: "backfill_share_skipped", reason: "revision_not_found", shareSectionId: row.id }));
        transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
        continue;
      }
      const inserted = transaction
        .insert(proposalShares)
        .values({
          proposalId: row.proposalId,
          revisionId,
          token: payload.token,
          expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
          createdAt: new Date(payload.createdAt),
          ...(payload.passwordSalt && payload.passwordHash && payload.accessKey
            ? { passwordSalt: payload.passwordSalt, passwordHash: payload.passwordHash, accessKey: payload.accessKey }
            : {}),
        })
        .returning({ id: proposalShares.id })
        .get();
      shareIdByToken.set(payload.token, inserted.id);
      transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
    }

    for (const row of lifecycleRows) {
      const payload = row.payload as ProposalLifecycleEventPayload;
      const shareId = shareIdByToken.get(payload.token);
      if (shareId) {
        transaction.insert(proposalEvents).values({
          proposalId: row.proposalId,
          shareId,
          type: payload.event,
          createdAt: new Date(payload.occurredAt),
        }).run();
      } else {
        console.warn(JSON.stringify({ event: "backfill_lifecycle_event_skipped", reason: "share_not_found", token: payload.token }));
      }
      transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
    }

    for (const row of approvalRows) {
      const payload = row.payload as ProposalApprovalPayload;
      const shareId = shareIdByToken.get(payload.token);
      if (shareId) {
        transaction.insert(proposalEvents).values({
          proposalId: row.proposalId,
          shareId,
          type: "approved",
          metadata: { name: payload.name, email: payload.email },
          createdAt: new Date(payload.approvedAt),
        }).run();
      } else {
        console.warn(JSON.stringify({ event: "backfill_approval_skipped", reason: "share_not_found", token: payload.token }));
      }
      transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
    }

    for (const row of pdfRows) {
      const payload = row.payload as Record<string, unknown> & { status?: string; generatedAt?: string };
      const { status, generatedAt, ...metadata } = payload;
      transaction.insert(proposalEvents).values({
        proposalId: row.proposalId,
        type: status === "success" ? "pdf_generated" : "pdf_failed",
        metadata,
        createdAt: generatedAt ? new Date(generatedAt) : new Date(),
      }).run();
      transaction.delete(proposalSections).where(eq(proposalSections.id, row.id)).run();
    }
  });

  console.info(JSON.stringify({
    event: "backfill_completed",
    designs: designRows.length,
    revisions: revisionRows.length,
    shares: shareRows.length,
    lifecycleEvents: lifecycleRows.length,
    approvals: approvalRows.length,
    pdfEvents: pdfRows.length,
  }));
}

main();
