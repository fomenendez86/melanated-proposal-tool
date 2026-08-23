import type {
  DocumentDesignChoice,
  DocumentDesignDescriptor,
  ProposalSectionType,
} from "./types";

const ALL_SECTION_TYPES: ProposalSectionType[] = [
  "cover",
  "fromOwners",
  "details",
  "overview",
  "triangleDivider",
  "hotel",
  "dayItinerary",
  "sectionDivider",
  "cityToursDivider",
  "excursionList",
  "twoColumnList",
  "pricing",
  "importantItems",
  "weather",
  "termsConditions",
  "thankYou",
];

const designs: DocumentDesignDescriptor[] = [
  {
    id: "melanated-editorial",
    version: 1,
    name: "Safari Editorial",
    description: "The current image-led Melanated Safaris proposal design.",
    status: "active",
    previewImageUrl: "/proposal-assets/cover-zebras-v1.png",
    page: { widthPx: 816, heightPx: 1056, formatLabel: "US Letter", orientation: "portrait" },
    brand: {
      primary: "#1c202b",
      secondary: "#566b4d",
      accent: "#d6b45b",
      surface: "#ffffff",
      text: "#1c202b",
      headingFontFamily: "var(--font-heading)",
      bodyFontFamily: "var(--font-sans)",
    },
    supportedSectionTypes: [...ALL_SECTION_TYPES],
    sectionVariants: {
      triangleDivider: [
        { id: "navy-triangle", label: "Navy triangle", description: "Large image with protected geometric title treatment." },
      ],
      sectionDivider: [
        { id: "editorial-bars", label: "Editorial bars", description: "Image divider with layered brand geometry." },
      ],
    },
    defaultVariantIds: {
      triangleDivider: "navy-triangle",
      sectionDivider: "editorial-bars",
    },
    rendererId: "melanated-blocks-v1",
    editorSchemaId: "structured-proposal-v1",
  },
  {
    id: "minimal-grid",
    version: 1,
    name: "Minimal Grid",
    description: "A neutral second fixture used to validate the shared editor contract.",
    status: "preview",
    previewImageUrl: "/proposal-assets/design-minimal-grid-preview.svg",
    page: { widthPx: 816, heightPx: 1056, formatLabel: "US Letter", orientation: "portrait" },
    brand: {
      primary: "#20252b",
      secondary: "#68727d",
      accent: "#d8c8a8",
      surface: "#f7f5f0",
      text: "#20252b",
      headingFontFamily: "sans-serif",
      bodyFontFamily: "sans-serif",
    },
    supportedSectionTypes: [...ALL_SECTION_TYPES],
    sectionVariants: {
      triangleDivider: [
        { id: "clean-title", label: "Clean title", description: "Reserved fixture variant for the minimal design renderer." },
      ],
      sectionDivider: [
        { id: "full-bleed", label: "Full bleed", description: "Reserved fixture variant for the minimal design renderer." },
      ],
    },
    defaultVariantIds: {
      triangleDivider: "clean-title",
      sectionDivider: "full-bleed",
    },
    rendererId: "melanated-blocks-v1",
    editorSchemaId: "structured-proposal-v1",
  },
];

export const DEFAULT_DOCUMENT_DESIGN = { id: "melanated-editorial", version: 1 } as const;

export function listDocumentDesigns() {
  return designs.map((design) => ({ ...design }));
}

export function getDocumentDesign(id: string, version: number) {
  return designs.find((design) => design.id === id && design.version === version) ?? null;
}

export function getDefaultDocumentDesign() {
  const design = getDocumentDesign(DEFAULT_DOCUMENT_DESIGN.id, DEFAULT_DOCUMENT_DESIGN.version);
  if (!design) throw new Error("Default document design is not registered.");
  return design;
}

export function getDesignChoices(sectionTypes: ProposalSectionType[]): DocumentDesignChoice[] {
  const uniqueTypes = [...new Set(sectionTypes)];
  return designs.map((design) => {
    const supported = new Set(design.supportedSectionTypes);
    const unsupportedSectionTypes = uniqueTypes.filter((type) => !supported.has(type));
    return {
      design: { ...design },
      compatible: unsupportedSectionTypes.length === 0,
      unsupportedSectionTypes,
    };
  });
}
