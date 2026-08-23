export type ProposalStatus = "draft" | "sent" | "viewed" | "approved" | "lost" | "archived";

const LIFECYCLE_RANK: Record<"draft" | "sent" | "viewed" | "approved", number> = {
  draft: 0,
  sent: 1,
  viewed: 2,
  approved: 3,
};

/**
 * Resolves the status a lifecycle event should move a proposal to, or null
 * if nothing should change. Only advances along draft -> sent -> viewed ->
 * approved, never backward, and never overrides "lost"/"archived" — those
 * are manual-only states (no UI to set them yet; that lands with the
 * Fase 12.2 dashboard).
 */
export function nextProposalStatus(
  current: ProposalStatus,
  target: "sent" | "viewed" | "approved"
): ProposalStatus | null {
  if (current === "lost" || current === "archived") return null;
  return LIFECYCLE_RANK[target] > LIFECYCLE_RANK[current] ? target : null;
}
