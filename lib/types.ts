export interface DayActivity {
  time: string;
  description: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  activities: DayActivity[];
}

export interface OverviewData {
  days: ItineraryDay[];
  pageNumber: number;
}

export interface ExcursionItem {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

export interface ExcursionListData {
  items: ExcursionItem[];
  pageNumber: number;
}

export interface SectionDividerData {
  title: string;
  subtitle?: string;
  imageUrl: string;
  pageNumber: number;
}

export interface HotelData {
  name: string;
  roomCategory: string;
  mealPlan: string;
  description: string;
  images: {
    topRight: string;
    bottomLeftTop: string;
    bottomLeftBottom: string;
  };
  pageNumber: number;
}

export interface FounderSignature {
  name: string;
  title: string;
}

export interface FromOwnersData {
  paragraphs: string[];
  founders: FounderSignature[];
  photoUrl: string;
  pageNumber: number;
}

export interface DetailRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface DetailsData {
  rows: DetailRow[];
  pageNumber: number;
}

export interface TwoColumnListSection {
  heading: string;
  lines: string[];
}

export interface TwoColumnListData {
  title: string;
  leftColumn: TwoColumnListSection[];
  rightColumn: TwoColumnListSection[];
  pageNumber: number;
}

export interface KeyValueLine {
  label: string;
  value: string;
}

export interface PricingData {
  intro: string;
  packagePricing: KeyValueLine[];
  paymentSchedule: KeyValueLine[];
  bankingInfo: KeyValueLine[];
  pageNumber: number;
}

export interface TermsSection {
  heading: string;
  paragraphs: string[];
}

export interface TermsConditionsData {
  sections: TermsSection[];
  pageNumber: number;
  showTitle?: boolean;
}

export interface DayEntry {
  dayNumber: number;
  subtitle?: string;
  highlightLine?: string;
  paragraphs: string[];
  imageUrls: string[];
}

export interface DayItineraryData {
  days: DayEntry[];
  pageNumber: number;
  showWelcomeSidebar?: boolean;
}

export interface TitleLine {
  text: string;
  style: "bold" | "script";
}

export interface TriangleDividerData {
  sectionLabel: string;
  titleLines: TitleLine[];
  imageUrl: string;
  pageNumber: number;
}

export interface CityToursDividerData {
  city: string;
  intro: string;
  priceNote: string;
  imageUrl: string;
  pageNumber: number;
}

export interface ImportantItemRow {
  icon: string;
  swatchColor: string;
  heading: string;
  bullets: string[];
  qrCodeUrl?: string;
}

export interface ImportantItemsData {
  rows: ImportantItemRow[];
  pageNumber: number;
}

export interface SeasonColumn {
  name: string;
  icon?: string;
  months: string;
  tempF: string;
  tempC: string;
}

export interface WeatherTable {
  title: string;
  seasons: SeasonColumn[];
  note: string;
}

export interface WeatherData {
  tables: WeatherTable[];
  pageNumber: number;
}

export interface ThankYouData {
  message: string;
  imageUrl: string;
  pageNumber: number;
}

export interface CoverData {
  title: string;
  subtitle: string;
  clientLine: string;
  imageUrl: string;
}

export type ProposalSection = (
  | { type: "cover"; data: CoverData }
  | { type: "fromOwners"; data: FromOwnersData }
  | { type: "details"; data: DetailsData }
  | { type: "overview"; data: OverviewData }
  | { type: "triangleDivider"; data: TriangleDividerData }
  | { type: "hotel"; data: HotelData }
  | { type: "dayItinerary"; data: DayItineraryData }
  | { type: "sectionDivider"; data: SectionDividerData }
  | { type: "cityToursDivider"; data: CityToursDividerData }
  | { type: "excursionList"; data: ExcursionListData }
  | { type: "twoColumnList"; data: TwoColumnListData }
  | { type: "pricing"; data: PricingData }
  | { type: "importantItems"; data: ImportantItemsData }
  | { type: "weather"; data: WeatherData }
  | { type: "termsConditions"; data: TermsConditionsData }
  | { type: "thankYou"; data: ThankYouData }
) & {
  editorSource?: {
    sectionId: number;
    refId: number | null;
  };
};

export interface ProposalData {
  sections: ProposalSection[];
}
