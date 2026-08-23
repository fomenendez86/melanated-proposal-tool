/**
 * Raw data cleared when a proposal is created from a template (Phase 13.1),
 * so the new proposal carries no residue from whichever proposal was
 * snapshotted into the template. This is a static list of DB-level concerns,
 * not an interpreter over the runtime `ProposalEditorField` view-model — that
 * view-model is populated per-page at editor-data-fetch time, the wrong
 * altitude for deciding what to clear before the new proposal even exists.
 * `lib/db/createProposalFromTemplate.ts` consults this list explicitly; a
 * unit test in `tests/core.test.mts` asserts its shape so a future column
 * addition can't silently bypass a reset.
 */
export const RESET_ON_TEMPLATE_FIELDS = [
  "leadClient",
  "travelDatesLabel",
  "arrivalAirport",
  "departureAirport",
  "proposalDaysDate",
] as const;

export type ResetOnTemplateField = (typeof RESET_ON_TEMPLATE_FIELDS)[number];
