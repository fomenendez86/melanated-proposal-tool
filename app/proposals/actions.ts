"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { createProposalFromItinerary } from "@/lib/db/createProposalFromItinerary";
import { createProposalFromTemplate } from "@/lib/db/createProposalFromTemplate";
import { db } from "@/lib/db/client";
import { duplicateProposal } from "@/lib/db/duplicateProposal";
import { generateProposalNumber } from "@/lib/db/generateProposalNumber";
import { clients, proposalClients, proposalEvents, proposalShares, proposalSignatures, proposals } from "@/lib/db/schema";
import { getDocumentDesign } from "@/lib/designs/registry";

export interface CreateProposalInput {
  client: { mode: "existing"; clientId: number } | { mode: "new"; fullName: string; email?: string };
  tripName: string;
  designId: string;
  designVersion: number;
  origin:
    | { type: "blank" }
    | { type: "duplicate"; sourceProposalId: number }
    | { type: "template"; templateId: number }
    | { type: "itinerary"; itineraryId: number; tierId: number | null };
}

export interface ProposalMutationResult {
  ok: boolean;
  formError?: string;
  id?: number;
}

function revalidateDashboard() {
  revalidatePath("/proposals");
}

async function resolveClientId(client: CreateProposalInput["client"]): Promise<number | { formError: string }> {
  if (client.mode === "existing") {
    if (!Number.isInteger(client.clientId)) return { formError: "Choose a client." };
    const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, client.clientId));
    if (!existing) return { formError: "That client no longer exists." };
    return existing.id;
  }
  const fullName = client.fullName?.trim() ?? "";
  if (!fullName || fullName.length > 120) return { formError: "Enter the client's name (up to 120 characters)." };
  const email = client.email?.trim() || null;
  if (email && email.length > 160) return { formError: "Email is too long." };
  try {
    return db.transaction((tx) => tx.insert(clients).values({ fullName, email }).returning({ id: clients.id }).get().id);
  } catch {
    return { formError: "The client could not be created." };
  }
}

export async function createProposal(input: CreateProposalInput): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const tripName = input.tripName?.trim() ?? "";
  if (!tripName || tripName.length > 120) return { ok: false, formError: "Enter a trip name (up to 120 characters)." };

  const design = getDocumentDesign(input.designId, input.designVersion);
  if (!design) return { ok: false, formError: "That document design is not available." };

  const clientResult = await resolveClientId(input.client);
  if (typeof clientResult !== "number") return { ok: false, formError: clientResult.formError };
  const clientId = clientResult;

  if (input.origin.type === "duplicate") {
    if (!Number.isInteger(input.origin.sourceProposalId)) return { ok: false, formError: "Choose a proposal to duplicate." };
    const result = await duplicateProposal(input.origin.sourceProposalId, { leadClientId: clientId });
    if (!result.ok || !result.id) return { ok: false, formError: result.formError ?? "The proposal could not be duplicated." };
    const newProposalId = result.id;
    try {
      db.transaction((tx) => {
        tx.update(proposals)
          .set({ designId: design.id, designVersion: design.version, packageName: tripName, coverTitle: tripName, updatedAt: new Date() })
          .where(eq(proposals.id, newProposalId))
          .run();
      });
    } catch {
      return { ok: false, formError: "The proposal was duplicated but could not be renamed. Open it from the list to fix it." };
    }
    revalidateDashboard();
    return { ok: true, id: newProposalId };
  }

  if (input.origin.type === "template") {
    if (!Number.isInteger(input.origin.templateId)) return { ok: false, formError: "Choose a template." };
    const result = await createProposalFromTemplate(input.origin.templateId, { leadClientId: clientId });
    if (!result.ok || !result.id) return { ok: false, formError: result.formError ?? "The proposal could not be created from the template." };
    const newProposalId = result.id;
    try {
      db.transaction((tx) => {
        tx.update(proposals)
          .set({ designId: design.id, designVersion: design.version, packageName: tripName, coverTitle: tripName, updatedAt: new Date() })
          .where(eq(proposals.id, newProposalId))
          .run();
      });
    } catch {
      return { ok: false, formError: "The proposal was created but could not be renamed. Open it from the list to fix it." };
    }
    revalidateDashboard();
    return { ok: true, id: newProposalId };
  }

  if (input.origin.type === "itinerary") {
    if (!Number.isInteger(input.origin.itineraryId)) return { ok: false, formError: "Choose an itinerary." };
    const result = await createProposalFromItinerary(input.origin.itineraryId, input.origin.tierId, { leadClientId: clientId });
    if (!result.ok || !result.id) return { ok: false, formError: result.formError ?? "The proposal could not be created from the itinerary." };
    const newProposalId = result.id;
    try {
      db.transaction((tx) => {
        tx.update(proposals)
          .set({ designId: design.id, designVersion: design.version, packageName: tripName, coverTitle: tripName, updatedAt: new Date() })
          .where(eq(proposals.id, newProposalId))
          .run();
      });
    } catch {
      return { ok: false, formError: "The proposal was created but could not be renamed. Open it from the list to fix it." };
    }
    revalidateDashboard();
    return { ok: true, id: newProposalId };
  }

  try {
    const newId = db.transaction((tx) => {
      const inserted = tx
        .insert(proposals)
        .values({
          proposalNumber: `TMP-${crypto.randomUUID()}`,
          leadClientId: clientId,
          status: "draft",
          designId: design.id,
          designVersion: design.version,
          packageName: tripName,
          coverTitle: tripName,
        })
        .returning({ id: proposals.id })
        .get();
      tx.update(proposals).set({ proposalNumber: generateProposalNumber(inserted.id) }).where(eq(proposals.id, inserted.id)).run();
      tx.insert(proposalClients).values({ proposalId: inserted.id, clientId, role: "lead" }).run();
      return inserted.id;
    });
    revalidateDashboard();
    return { ok: true, id: newId };
  } catch {
    return { ok: false, formError: "The proposal could not be created." };
  }
}

export async function duplicateProposalFromDashboard(proposalId: number): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId)) return { ok: false, formError: "Proposal not found." };
  const result = await duplicateProposal(proposalId);
  if (result.ok) revalidateDashboard();
  return result;
}

export async function archiveProposal(proposalId: number): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId)) return { ok: false, formError: "Proposal not found." };
  try {
    db.transaction((tx) => {
      tx.update(proposals).set({ status: "archived", updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The proposal could not be archived." };
  }
  revalidateDashboard();
  return { ok: true };
}

export async function restoreProposal(proposalId: number): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId)) return { ok: false, formError: "Proposal not found." };
  try {
    db.transaction((tx) => {
      tx.update(proposals).set({ status: "draft", updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The proposal could not be restored." };
  }
  revalidateDashboard();
  return { ok: true };
}

export async function deleteProposal(proposalId: number): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId)) return { ok: false, formError: "Proposal not found." };
  const [proposal] = await db.select({ status: proposals.status }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };
  if (proposal.status !== "draft") return { ok: false, formError: "Only draft proposals can be deleted." };
  const [share] = await db.select({ id: proposalShares.id }).from(proposalShares).where(eq(proposalShares.proposalId, proposalId)).limit(1);
  if (share) return { ok: false, formError: "This proposal has been shared and can no longer be deleted." };
  try {
    db.transaction((tx) => {
      tx.delete(proposals).where(eq(proposals.id, proposalId)).run();
    });
  } catch {
    return { ok: false, formError: "The proposal could not be deleted." };
  }
  revalidateDashboard();
  return { ok: true };
}

export async function markProposalLost(proposalId: number, reason?: string): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const normalizedReason = reason?.trim() || null;
  if (!Number.isInteger(proposalId) || (normalizedReason && normalizedReason.length > 500)) return { ok: false, formError: "Invalid lost reason." };
  const [proposal] = await db.select({ id: proposals.id, pipelineStage: proposals.pipelineStage }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal || proposal.pipelineStage === "won") return { ok: false, formError: proposal?.pipelineStage === "won" ? "A signed Won proposal cannot be marked Lost." : "Proposal not found." };
  const changedAt = new Date();
  db.transaction((tx) => { tx.update(proposals).set({ status: "lost", pipelineStage: "lost", lostReason: normalizedReason, updatedAt: changedAt }).where(eq(proposals.id, proposalId)).run(); tx.insert(proposalEvents).values({ proposalId, type: "lost", metadata: { reason: normalizedReason }, createdAt: changedAt }).run(); });
  revalidateDashboard(); return { ok: true };
}

export async function reopenProposal(proposalId: number): Promise<ProposalMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId)) return { ok: false, formError: "Proposal not found." };
  const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };
  const [signature] = await db.select({ id: proposalSignatures.id }).from(proposalSignatures).where(eq(proposalSignatures.proposalId, proposalId)).limit(1);
  if (signature) {
    const duplicated = await duplicateProposal(proposalId);
    if (!duplicated.ok || !duplicated.id) return duplicated;
    await db.insert(proposalEvents).values({ proposalId, type: "reopened", metadata: { duplicatedProposalId: duplicated.id, immutableOriginal: true } });
    revalidateDashboard(); return duplicated;
  }
  await db.update(proposals).set({ status: "draft", pipelineStage: "draft", lostReason: null, closedValueMinor: null, closedCurrency: null, updatedAt: new Date() }).where(eq(proposals.id, proposalId));
  await db.insert(proposalEvents).values({ proposalId, type: "reopened", metadata: { immutableOriginal: false } });
  revalidateDashboard(); return { ok: true, id: proposalId };
}
