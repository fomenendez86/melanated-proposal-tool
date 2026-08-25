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
  "signature",
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
    requiredVariablePaths: ["client.name", "trip.title"],
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
    requiredVariablePaths: ["client.name", "trip.title"],
    rendererId: "melanated-blocks-v1",
    editorSchemaId: "structured-proposal-v1",
  },
  {
    // v2, not a v1 edit: a breaking renderer change must create a new
    // version rather than mutate a registered one (see
    // docs/DOCUMENT_DESIGN_CONTRACT.md "Versioning rules"). v1 stays
    // registered unchanged for any proposal/revision that already
    // references it.
    id: "minimal-grid",
    version: 2,
    name: "Minimal Grid",
    description: "A structured, hairline-grid document design with its own block renderer — no imagery-led editorial treatment, no italics.",
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
        { id: "clean-title", label: "Clean title", description: "Hairline rule with a left-aligned title block, no image." },
      ],
      sectionDivider: [
        { id: "full-bleed", label: "Full bleed", description: "Full-bleed image with a structured label bar." },
      ],
    },
    defaultVariantIds: {
      triangleDivider: "clean-title",
      sectionDivider: "full-bleed",
    },
    requiredVariablePaths: ["client.name", "trip.title"],
    rendererId: "minimal-grid-v1",
    editorSchemaId: "structured-proposal-v1",
  },
];

export const DEFAULT_DOCUMENT_DESIGN = { id: "melanated-editorial", version: 1 } as const;

export function listDocumentDesigns() {
  return designs.map((design) => ({ ...design }));
}

/**
 * Same as `listDocumentDesigns()`, deduplicated to the highest registered
 * `version` per `id`. Older versions stay registered (for `getDocumentDesign`
 * to resolve exact snapshots against, per the versioning rules in
 * docs/DOCUMENT_DESIGN_CONTRACT.md) but are superseded fixtures, not
 * something a "new proposal" or "switch design" picker should offer
 * alongside their own newer version under the same display name.
 */
export function listSelectableDocumentDesigns() {
  const latestById = new Map<string, DocumentDesignDescriptor>();
  for (const design of designs) {
    const current = latestById.get(design.id);
    if (!current || design.version > current.version) latestById.set(design.id, design);
  }
  return [...latestById.values()].map((design) => ({ ...design }));
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
  return listSelectableDocumentDesigns().map((design) => {
    const supported = new Set(design.supportedSectionTypes);
    const unsupportedSectionTypes = uniqueTypes.filter((type) => !supported.has(type));
    return {
      design: { ...design },
      compatible: unsupportedSectionTypes.length === 0,
      unsupportedSectionTypes,
    };
  });
}
