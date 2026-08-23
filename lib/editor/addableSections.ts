import type { ProposalSectionType } from "@/lib/designs/types";

export interface AddableSection {
  type: ProposalSectionType;
  label: string;
}

export const ADDABLE_SECTIONS: AddableSection[] = [
  { type: "triangleDivider", label: "Image title divider" },
  { type: "sectionDivider", label: "Editorial section divider" },
  { type: "thankYou", label: "Thank-you page" },
];

// Default payloads for the section types above — the only ones that can be
// inserted without catalog/proposal data (hotels, excursions, etc. need a
// specific item chosen first). Shared between the "+" insertion menu
// (compositionActions.ts) and anything else that needs a blank starter
// payload for these types.
export const ADDABLE_SECTION_DEFAULTS: Partial<Record<ProposalSectionType, Record<string, unknown>>> = {
  triangleDivider: { sectionLabel: "New section", titleLines: [{ text: "Section title", style: "bold" }], imageUrl: "" },
  sectionDivider: { title: "NEW SECTION", subtitle: "Add a supporting line", imageUrl: "" },
  thankYou: { message: "Thank you for traveling with us.", imageUrl: "" },
};
