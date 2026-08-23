import { eq } from "drizzle-orm";

import { copyProposalGraphInto } from "./copyProposalGraph";
import { generateProposalNumber } from "./generateProposalNumber";
import { db } from "./client";
import { proposalClients, proposalDays, proposals } from "./schema";

export interface CreateProposalFromTemplateResult {
  ok: boolean;
  id?: number;
  formError?: string;
}

// Deep-copies a template's graph into a brand-new proposal, then clears the
// fields in RESET_ON_TEMPLATE_FIELDS (lib/editor/resetOnTemplateFields.ts) so
// the new proposal carries no residue from whichever proposal the template
// was originally snapshotted from. Client roster is NOT copied from the
// template (skipClients) — only the caller-supplied leadClientId is set as
// the sole lead traveler, same as a fresh blank proposal.
export async function createProposalFromTemplate(
  templateId: number,
  overrides: { leadClientId: number }
): Promise<CreateProposalFromTemplateResult> {
  const [template] = await db.select().from(proposals).where(eq(proposals.id, templateId));
  if (!template || !template.isTemplate) return { ok: false, formError: "Template not found." };

  try {
    const newId = db.transaction((tx) => {
      const inserted = tx
        .insert(proposals)
        .values({
          proposalNumber: `TMP-${crypto.randomUUID()}`,
          leadClientId: overrides.leadClientId,
          status: "draft",
          designId: template.designId,
          designVersion: template.designVersion,
          packageName: template.packageName,
          selectedTier: template.selectedTier,
          specialOccasion: template.specialOccasion,
          arrivalAirport: null,
          departureAirport: null,
          termsTemplateId: template.termsTemplateId,
          coverTitle: template.coverTitle,
          coverSubtitle: template.coverSubtitle,
          coverImageUrl: template.coverImageUrl,
          travelDatesLabel: null,
          packageTotalLabel: template.packageTotalLabel,
          passengerManifestLabel: template.passengerManifestLabel,
        })
        .returning({ id: proposals.id })
        .get();
      const newProposalId = inserted.id;
      tx.update(proposals).set({ proposalNumber: generateProposalNumber(newProposalId) }).where(eq(proposals.id, newProposalId)).run();

      copyProposalGraphInto(tx, templateId, newProposalId, {
        leadClientId: overrides.leadClientId,
        skipClients: true,
      });
      tx.insert(proposalClients).values({ proposalId: newProposalId, clientId: overrides.leadClientId, role: "lead" }).run();

      const insertedDays = tx.select({ id: proposalDays.id }).from(proposalDays).where(eq(proposalDays.proposalId, newProposalId)).all();
      for (const day of insertedDays) {
        tx.update(proposalDays).set({ date: null }).where(eq(proposalDays.id, day.id)).run();
      }

      return newProposalId;
    });

    return { ok: true, id: newId };
  } catch {
    return { ok: false, formError: "The proposal could not be created from the template." };
  }
}
