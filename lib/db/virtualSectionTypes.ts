// sectionType values that mark a proposal_sections row as metadata rather
// than a rendered document section. Only "fromOwnersOverride" remains here —
// documentDesign, pdfGeneration, proposalRevision, shareSettings,
// proposalLifecycleEvent and proposalApproval were promoted to real
// tables/columns (Fase 12.1); see lib/db/schema.ts.
export const VIRTUAL_SECTION_TYPES = new Set(["fromOwnersOverride"]);
