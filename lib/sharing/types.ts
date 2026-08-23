import type { proposalRevisions, proposalShares } from "@/lib/db/schema";

export interface CreateShareResult {
  ok: boolean;
  path?: string;
  expiresAt?: string | null;
  formError?: string;
}

export interface SharedProposalRecord {
  share: typeof proposalShares.$inferSelect;
  revision: typeof proposalRevisions.$inferSelect;
}
