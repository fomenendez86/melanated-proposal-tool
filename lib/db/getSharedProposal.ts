import { eq } from "drizzle-orm";

import type {
  ProposalRevisionPayload,
  ProposalShareSettingsPayload,
  SharedProposalRecord,
} from "@/lib/sharing/types";

import { db } from "./client";
import { proposalSections } from "./schema";

export function shareCookieName(token: string) {
  return `proposal_share_${token.slice(0, 16)}`;
}

export function isSharedProposalExpired(expiresAt: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());
}

export async function getSharedProposal(token: string): Promise<SharedProposalRecord | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const settingsRows = await db
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.sectionType, "shareSettings"));
  const settingsRow = settingsRows.find((row) =>
    (row.payload as ProposalShareSettingsPayload | null)?.token === token
  );
  if (!settingsRow) return null;
  const settings = settingsRow.payload as ProposalShareSettingsPayload;
  const [revisionRow] = await db
    .select()
    .from(proposalSections)
    .where(eq(proposalSections.id, settings.revisionSectionId));
  if (!revisionRow || revisionRow.sectionType !== "proposalRevision") return null;
  return {
    settingsSectionId: settingsRow.id,
    settings,
    revision: revisionRow.payload as ProposalRevisionPayload,
  };
}

export async function recordShareEvent(
  proposalId: number,
  token: string,
  event: "opened" | "approved"
) {
  await db.insert(proposalSections).values({
    proposalId,
    sectionType: "proposalLifecycleEvent",
    sortOrder: -4,
    payload: { token, event, occurredAt: new Date().toISOString() },
  });
}
