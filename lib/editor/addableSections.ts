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
