import { eq } from "drizzle-orm";

import { copyItineraryGraphInto } from "./copyItineraryGraphInto";
import { generateProposalNumber } from "./generateProposalNumber";
import { db } from "./client";
import { itineraries, itineraryTiers, proposalClients, proposalDays, proposals } from "./schema";

export interface CreateProposalFromItineraryResult {
  ok: boolean;
  id?: number;
  formError?: string;
}

// Deep-copies an itinerary (filtered to one tier, or everything if the
// itinerary has no tiers) into a brand-new proposal. designId/designVersion
// are intentionally left unset here — the caller (createProposal()) always
// overwrites them from its own fresh selection, same as the template/
// duplicate origins, so design choice stays fully decoupled from content.
export async function createProposalFromItinerary(
  itineraryId: number,
  tierId: number | null,
  overrides: { leadClientId: number }
): Promise<CreateProposalFromItineraryResult> {
  const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, itineraryId));
  if (!itinerary || itinerary.archivedAt) return { ok: false, formError: "Itinerary not found." };

  if (tierId !== null) {
    const [tier] = await db.select().from(itineraryTiers).where(eq(itineraryTiers.id, tierId));
    if (!tier || tier.itineraryId !== itineraryId) return { ok: false, formError: "That tier does not belong to this itinerary." };
  }

  try {
    const newId = db.transaction((tx) => {
      const inserted = tx
        .insert(proposals)
        .values({
          proposalNumber: `TMP-${crypto.randomUUID()}`,
          leadClientId: overrides.leadClientId,
          status: "draft",
          packageName: itinerary.name,
          coverTitle: itinerary.name,
        })
        .returning({ id: proposals.id })
        .get();
      const newProposalId = inserted.id;
      tx.update(proposals).set({ proposalNumber: generateProposalNumber(newProposalId) }).where(eq(proposals.id, newProposalId)).run();

      copyItineraryGraphInto(tx, itineraryId, tierId, newProposalId);
      tx.insert(proposalClients).values({ proposalId: newProposalId, clientId: overrides.leadClientId, role: "lead" }).run();

      const insertedDays = tx.select({ id: proposalDays.id }).from(proposalDays).where(eq(proposalDays.proposalId, newProposalId)).all();
      for (const day of insertedDays) {
        tx.update(proposalDays).set({ date: null }).where(eq(proposalDays.id, day.id)).run();
      }

      return newProposalId;
    });

    return { ok: true, id: newId };
  } catch {
    return { ok: false, formError: "The proposal could not be created from the itinerary." };
  }
}
