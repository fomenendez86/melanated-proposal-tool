"use server";

import { randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { proposalSections, proposals } from "@/lib/db/schema";
import type { CreateShareResult, ProposalRevisionPayload, ProposalShareSettingsPayload } from "@/lib/sharing/types";

export async function createProposalShare(
  proposalId: number,
  input: { password?: string; expiresInDays?: number }
): Promise<CreateShareResult> {
  if (!Number.isInteger(proposalId) || proposalId < 1) return { ok: false, formError: "Invalid proposal." };
  const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };
  const password = input.password?.trim() ?? "";
  if (password && (password.length < 8 || password.length > 128)) {
    return { ok: false, formError: "Use a password from 8 to 128 characters." };
  }
  const expiresInDays = input.expiresInDays ?? 30;
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
    return { ok: false, formError: "Expiration must be from 1 to 365 days." };
  }

  const data = await getProposalData(proposalId);
  const designContext = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + expiresInDays * 86_400_000).toISOString();
  const token = randomBytes(24).toString("hex");
  const salt = password ? randomBytes(16).toString("hex") : undefined;
  const passwordHash = password && salt ? scryptSync(password, salt, 32).toString("hex") : undefined;
  const accessKey = password ? randomBytes(24).toString("hex") : undefined;

  try {
    db.transaction((transaction) => {
      const revisionPayload: ProposalRevisionPayload = {
        proposalId,
        createdAt: createdAt.toISOString(),
        data,
        design: designContext.active,
      };
      const revision = transaction.insert(proposalSections).values({
        proposalId,
        sectionType: "proposalRevision",
        sortOrder: -5,
        payload: revisionPayload,
      }).returning({ id: proposalSections.id }).get();
      const settingsPayload: ProposalShareSettingsPayload = {
        token,
        revisionSectionId: revision.id,
        createdAt: createdAt.toISOString(),
        expiresAt,
        ...(salt && passwordHash && accessKey ? { passwordSalt: salt, passwordHash, accessKey } : {}),
      };
      transaction.insert(proposalSections).values({
        proposalId,
        sectionType: "shareSettings",
        sortOrder: -6,
        payload: settingsPayload,
      }).run();
      transaction.insert(proposalSections).values({
        proposalId,
        sectionType: "proposalLifecycleEvent",
        sortOrder: -4,
        payload: { token, event: "shared", occurredAt: createdAt.toISOString() },
      }).run();
    });
  } catch {
    return { ok: false, formError: "The share link could not be created." };
  }
  return { ok: true, path: `/share/${token}`, expiresAt };
}
