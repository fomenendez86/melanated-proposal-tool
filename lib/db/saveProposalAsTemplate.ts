import { eq } from "drizzle-orm";

import { copyProposalGraphInto } from "./copyProposalGraph";
import { generateProposalNumber } from "./generateProposalNumber";
import { db } from "./client";
import { proposals } from "./schema";

export interface SaveProposalAsTemplateResult {
  ok: boolean;
  id?: number;
  formError?: string;
}

// Deep-copies proposalId's graph into a brand-new template row (isTemplate),
// same shape as duplicateProposal — every child gets a fresh id, so later
// edits to either the source proposal or the template never affect the
// other. A template can't itself be saved as a template.
export async function saveProposalAsTemplate(
  proposalId: number,
  input: { name: string; description: string | null }
): Promise<SaveProposalAsTemplateResult> {
  const [source] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
  if (!source) return { ok: false, formError: "Proposal not found." };
  if (source.isTemplate) return { ok: false, formError: "A template cannot be saved as another template." };

  try {
    const newId = db.transaction((tx) => {
      const inserted = tx
        .insert(proposals)
        .values({
          proposalNumber: `TMP-${crypto.randomUUID()}`,
          leadClientId: source.leadClientId,
          status: "draft",
          isTemplate: true,
          templateName: input.name,
          templateDescription: input.description,
          templateThumbnailUrl: source.coverImageUrl,
          designId: source.designId,
          designVersion: source.designVersion,
          packageName: source.packageName,
          selectedTier: source.selectedTier,
          specialOccasion: source.specialOccasion,
          arrivalAirport: source.arrivalAirport,
          departureAirport: source.departureAirport,
          termsTemplateId: source.termsTemplateId,
          coverTitle: source.coverTitle,
          coverSubtitle: source.coverSubtitle,
          coverImageUrl: source.coverImageUrl,
          travelDatesLabel: source.travelDatesLabel,
          packageTotalLabel: source.packageTotalLabel,
          passengerManifestLabel: source.passengerManifestLabel,
        })
        .returning({ id: proposals.id })
        .get();
      const newTemplateId = inserted.id;
      tx.update(proposals).set({ proposalNumber: generateProposalNumber(newTemplateId) }).where(eq(proposals.id, newTemplateId)).run();

      copyProposalGraphInto(tx, proposalId, newTemplateId, {});

      return newTemplateId;
    });

    return { ok: true, id: newId };
  } catch {
    return { ok: false, formError: "The template could not be saved." };
  }
}
