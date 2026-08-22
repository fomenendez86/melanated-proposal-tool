import type { ProposalSectionType } from "@/lib/designs/types";

export interface ProposalCompositionItem {
  id: number;
  sectionType: ProposalSectionType;
  sortOrder: number;
  label: string;
  hidden: boolean;
  deleted: boolean;
  variantId?: string;
}

export interface ProposalCompositionData {
  items: ProposalCompositionItem[];
}

export interface CompositionMutationResult {
  ok: boolean;
  formError?: string;
}
