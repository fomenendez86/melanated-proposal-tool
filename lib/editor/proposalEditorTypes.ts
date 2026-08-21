export type ProposalEditorFieldName =
  | "coverTitle"
  | "coverSubtitle"
  | "clientName"
  | "coverImageUrl"
  | "packageName"
  | "selectedTier"
  | "travelDatesLabel"
  | "passengerManifestLabel"
  | "specialOccasion"
  | "arrivalAirport"
  | "departureAirport"
  | "packageTotalLabel"
  | "roomCategory"
  | "mealPlan"
  | "nights"
  | "pricingIntro"
  | "invoiceTotal"
  | "commission"
  | "amountDue"
  | "currency"
  | "sectionLabel"
  | "titleLine1"
  | "titleLine2"
  | "titleLine3"
  | "dividerTitle"
  | "dividerSubtitle"
  | "sectionImageUrl"
  | "cityIntro"
  | "priceNote"
  | "thankYouMessage";

export interface ProposalEditorField {
  name: ProposalEditorFieldName;
  label: string;
  value: string;
  required?: boolean;
  multiline?: boolean;
  maxLength: number;
  placeholder?: string;
  helpText?: string;
}

export interface ProposalEditorPageConfig {
  pageId: string;
  kind:
    | "cover"
    | "details"
    | "hotelBooking"
    | "pricing"
    | "triangleDivider"
    | "sectionDivider"
    | "cityToursDivider"
    | "thankYou";
  sourceSectionId?: number;
  sourceRefId?: number | null;
  heading: string;
  description: string;
  fields: ProposalEditorField[];
}

export type ProposalEditorPageMap = Record<string, ProposalEditorPageConfig>;

export interface UpdateProposalFieldsInput {
  kind: ProposalEditorPageConfig["kind"];
  sourceSectionId?: number;
  sourceRefId?: number | null;
  values: Partial<Record<ProposalEditorFieldName, string>>;
}

export interface UpdateProposalFieldsResult {
  ok: boolean;
  savedAt?: string;
  fieldErrors?: Partial<Record<ProposalEditorFieldName, string>>;
  formError?: string;
}

export type EditorSaveState = "loaded" | "dirty" | "saving" | "saved" | "error";
