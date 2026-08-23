import { eq } from "drizzle-orm";

import { copyProposalGraphInto } from "./copyProposalGraph";
import { db } from "./client";
import {
  proposalClients,
  proposalDays,
  proposalExcursions,
  proposalHotels,
  proposalListSections,
  proposalPaymentSchedule,
  proposalPricing,
  proposalSections,
  proposals,
} from "./schema";

export interface UpdateTemplateFromProposalResult {
  ok: boolean;
  formError?: string;
}

// Replaces a template's child graph with a fresh copy from sourceProposalId,
// so future "create from template" calls pick up the latest content —
// without touching proposals already created from the template (they hold
// their own independent copy, made at creation time). Only templateId rows
// (isTemplate=true) can be targeted.
export async function updateTemplateFromProposal(
  templateId: number,
  sourceProposalId: number
): Promise<UpdateTemplateFromProposalResult> {
  const [template] = await db.select().from(proposals).where(eq(proposals.id, templateId));
  if (!template || !template.isTemplate) return { ok: false, formError: "Template not found." };

  const [source] = await db.select().from(proposals).where(eq(proposals.id, sourceProposalId));
  if (!source) return { ok: false, formError: "Source proposal not found." };

  try {
    db.transaction((tx) => {
      // Every child table here cascades from its proposal-scoped parent
      // (proposalDays -> activities/paragraphs/images, proposalListSections
      // -> lines) per the FK convention in lib/db/schema.ts, so deleting
      // these top-level rows is enough to clear the whole graph.
      tx.delete(proposalClients).where(eq(proposalClients.proposalId, templateId)).run();
      tx.delete(proposalDays).where(eq(proposalDays.proposalId, templateId)).run();
      tx.delete(proposalHotels).where(eq(proposalHotels.proposalId, templateId)).run();
      tx.delete(proposalExcursions).where(eq(proposalExcursions.proposalId, templateId)).run();
      tx.delete(proposalListSections).where(eq(proposalListSections.proposalId, templateId)).run();
      tx.delete(proposalPricing).where(eq(proposalPricing.proposalId, templateId)).run();
      tx.delete(proposalPaymentSchedule).where(eq(proposalPaymentSchedule.proposalId, templateId)).run();
      tx.delete(proposalSections).where(eq(proposalSections.proposalId, templateId)).run();

      copyProposalGraphInto(tx, sourceProposalId, templateId, {});

      tx.update(proposals)
        .set({
          designId: source.designId,
          designVersion: source.designVersion,
          packageName: source.packageName,
          selectedTier: source.selectedTier,
          specialOccasion: source.specialOccasion,
          coverTitle: source.coverTitle,
          coverSubtitle: source.coverSubtitle,
          coverImageUrl: source.coverImageUrl,
          packageTotalLabel: source.packageTotalLabel,
          passengerManifestLabel: source.passengerManifestLabel,
          templateThumbnailUrl: source.coverImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, templateId))
        .run();
    });

    return { ok: true };
  } catch {
    return { ok: false, formError: "The template could not be updated." };
  }
}
