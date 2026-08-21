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
}

export interface ExcursionItem {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

export interface ExcursionListData {
  items: ExcursionItem[];
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
