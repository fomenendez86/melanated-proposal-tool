import type { ProposalSection } from "@/lib/types";

export type ProposalSectionType = ProposalSection["type"];

export interface DocumentPageGeometry {
  widthPx: number;
  heightPx: number;
  formatLabel: string;
  orientation: "portrait" | "landscape";
}

export interface DocumentDesignVariant {
  id: string;
  label: string;
  description: string;
}

export interface DocumentDesignBrandTokens {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  headingFontFamily: string;
  bodyFontFamily: string;
}

export interface DocumentDesignDescriptor {
  id: string;
  version: number;
  name: string;
  description: string;
  status: "active" | "preview";
  previewImageUrl: string;
  page: DocumentPageGeometry;
  brand: DocumentDesignBrandTokens;
  supportedSectionTypes: ProposalSectionType[];
  sectionVariants: Partial<Record<ProposalSectionType, DocumentDesignVariant[]>>;
  defaultVariantIds: Partial<Record<ProposalSectionType, string>>;
  rendererId: string;
  editorSchemaId: string;
}

export interface DocumentDesignChoice {
  design: DocumentDesignDescriptor;
  compatible: boolean;
  unsupportedSectionTypes: ProposalSectionType[];
}

export interface ProposalDesignContext {
  active: DocumentDesignDescriptor;
  choices: DocumentDesignChoice[];
}

export interface UpdateProposalDesignResult {
  ok: boolean;
  formError?: string;
}
