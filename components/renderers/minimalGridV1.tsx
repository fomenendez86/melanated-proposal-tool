import CityToursDividerBlock from "@/components/blocks/minimal-grid/CityToursDividerBlock";
import CoverBlock from "@/components/blocks/minimal-grid/CoverBlock";
import DayItineraryBlock from "@/components/blocks/minimal-grid/DayItineraryBlock";
import DetailsBlock from "@/components/blocks/minimal-grid/DetailsBlock";
import ExcursionListBlock from "@/components/blocks/minimal-grid/ExcursionListBlock";
import FlightDetailsBlock from "@/components/blocks/minimal-grid/FlightDetailsBlock";
import FromOwnersBlock from "@/components/blocks/minimal-grid/FromOwnersBlock";
import HotelBlock from "@/components/blocks/minimal-grid/HotelBlock";
import ImportantItemsBlock from "@/components/blocks/minimal-grid/ImportantItemsBlock";
import OverviewBlock from "@/components/blocks/minimal-grid/OverviewBlock";
import PricingBlock from "@/components/blocks/minimal-grid/PricingBlock";
import SectionDividerBlock from "@/components/blocks/minimal-grid/SectionDividerBlock";
import SignatureBlock from "@/components/blocks/minimal-grid/SignatureBlock";
import TermsConditionsBlock from "@/components/blocks/minimal-grid/TermsConditionsBlock";
import ThankYouBlock from "@/components/blocks/minimal-grid/ThankYouBlock";
import TransportDetailsBlock from "@/components/blocks/minimal-grid/TransportDetailsBlock";
import TriangleDividerBlock from "@/components/blocks/minimal-grid/TriangleDividerBlock";
import TwoColumnListBlock from "@/components/blocks/minimal-grid/TwoColumnListBlock";
import WeatherBlock from "@/components/blocks/minimal-grid/WeatherBlock";
import type { ProposalSection } from "@/lib/types";

/**
 * Minimal Grid's own block renderer — registered as `rendererId:
 * "minimal-grid-v1"` on `minimal-grid` v2 (lib/designs/registry.ts). A
 * structured, hairline-grid layout system: no clip-path/triangle geometry,
 * no italics, off-white surface — see docs/DOCUMENT_DESIGN_CONTRACT.md.
 */
export function renderMinimalGridV1Section(section: ProposalSection) {
  switch (section.type) {
    case "cover":
      return <CoverBlock data={section.data} />;
    case "fromOwners":
      return <FromOwnersBlock data={section.data} />;
    case "details":
      return <DetailsBlock data={section.data} />;
    case "overview":
      return <OverviewBlock data={section.data} />;
    case "triangleDivider":
      return <TriangleDividerBlock data={section.data} />;
    case "hotel":
      return <HotelBlock data={section.data} />;
    case "dayItinerary":
      return <DayItineraryBlock data={section.data} />;
    case "sectionDivider":
      return <SectionDividerBlock data={section.data} />;
    case "cityToursDivider":
      return <CityToursDividerBlock data={section.data} />;
    case "excursionList":
      return <ExcursionListBlock data={section.data} />;
    case "twoColumnList":
      return <TwoColumnListBlock data={section.data} />;
    case "pricing":
      return <PricingBlock data={section.data} />;
    case "importantItems":
      return <ImportantItemsBlock data={section.data} />;
    case "weather":
      return <WeatherBlock data={section.data} />;
    case "termsConditions":
      return <TermsConditionsBlock data={section.data} />;
    case "thankYou":
      return <ThankYouBlock data={section.data} />;
    case "signature":
      return <SignatureBlock data={section.data} />;
    case "flightDetails":
      return <FlightDetailsBlock data={section.data} />;
    case "transportDetails":
      return <TransportDetailsBlock data={section.data} />;
  }
}
