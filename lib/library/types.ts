import type { ProposalSectionType } from "@/lib/designs/types";

export interface LibrarySectionItem {
  id: number;
  name: string;
  description: string | null;
  sectionType: ProposalSectionType;
  payload: Record<string, unknown>;
  variantId: string | null;
  tags: string[];
}

export interface LibrarySnippetItem {
  id: number;
  name: string;
  body: string;
  tags: string[];
}

export interface LibraryImageItem {
  id: number;
  name: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  tags: string[];
}

export type LibraryFeeUnit = "flat" | "per_person" | "per_night" | "per_vehicle";

export interface LibraryFeeItem {
  id: number;
  name: string;
  description: string | null;
  unitPriceMinor: number;
  currency: string;
  unit: LibraryFeeUnit;
  taxRateBps: number;
}

export interface ContentLibraryData {
  sections: LibrarySectionItem[];
  snippets: LibrarySnippetItem[];
  images: LibraryImageItem[];
  fees: LibraryFeeItem[];
}

export interface LibraryMutationResult {
  ok: boolean;
  formError?: string;
  id?: number;
}

export interface SaveLibrarySectionInput {
  name: string;
  description?: string;
  tags?: string[];
}

export interface SaveLibrarySnippetInput {
  name: string;
  body: string;
  tags?: string[];
}

export interface SaveLibraryFeeInput {
  name: string;
  description?: string;
  unitPriceMinor: number;
  currency: string;
  unit: LibraryFeeUnit;
  taxRateBps: number;
}
