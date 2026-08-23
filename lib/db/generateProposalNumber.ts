// Ties a proposal_number 1:1 to the row's autoincrement id, so callers can
// insert with a throwaway unique placeholder and then rename it once the id
// is known — no counting query, no race between concurrent creations.
export function generateProposalNumber(id: number): string {
  return `PRO-${String(id).padStart(4, "0")}`;
}
