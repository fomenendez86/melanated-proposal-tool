import type { CSSProperties } from "react";

import CityToursDividerBlock from "@/components/blocks/CityToursDividerBlock";
import CoverBlock from "@/components/blocks/CoverBlock";
import DayItineraryBlock from "@/components/blocks/DayItineraryBlock";
import DetailsBlock from "@/components/blocks/DetailsBlock";
import ExcursionListBlock from "@/components/blocks/ExcursionListBlock";
import FromOwnersBlock from "@/components/blocks/FromOwnersBlock";
import HotelBlock from "@/components/blocks/HotelBlock";
import ImportantItemsBlock from "@/components/blocks/ImportantItemsBlock";
import OverviewBlock from "@/components/blocks/OverviewBlock";
import PricingBlock from "@/components/blocks/PricingBlock";
import SectionDividerBlock from "@/components/blocks/SectionDividerBlock";
import SignatureBlock from "@/components/blocks/SignatureBlock";
import TermsConditionsBlock from "@/components/blocks/TermsConditionsBlock";
import ThankYouBlock from "@/components/blocks/ThankYouBlock";
import TriangleDividerBlock from "@/components/blocks/TriangleDividerBlock";
import TwoColumnListBlock from "@/components/blocks/TwoColumnListBlock";
import WeatherBlock from "@/components/blocks/WeatherBlock";
import { getDefaultDocumentDesign } from "@/lib/designs/registry";
import type { DocumentDesignDescriptor } from "@/lib/designs/types";
import type { ProposalData, ProposalSection } from "@/lib/types";

/** CSS custom properties so shared blocks (SectionHeader, PageFooter, ...)
 * can read the active design's brand colors instead of hardcoding one. */
function designStyle(design: DocumentDesignDescriptor): CSSProperties {
  return {
    "--design-primary": design.brand.primary,
    "--design-secondary": design.brand.secondary,
    "--design-accent": design.brand.accent,
  } as CSSProperties;
}

export function ProposalSectionView({ section, design = getDefaultDocumentDesign() }: { section: ProposalSection; design?: DocumentDesignDescriptor }) {
  return <div style={designStyle(design)}>{renderSection(section)}</div>;
}

function renderSection(section: ProposalSection) {
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
  }
}

interface ProposalRendererProps {
  data: ProposalData;
  design?: DocumentDesignDescriptor;
}

export default function ProposalRenderer({ data, design }: ProposalRendererProps) {
  return (
    <>
      {data.sections.map((section, index) => (
        <div
          key={index}
          data-proposal-page
          data-proposal-page-number={index + 1}
          data-proposal-section-type={section.type}
          style={{
            breakAfter: index < data.sections.length - 1 ? "page" : "auto",
          }}
        >
          <ProposalSectionView section={section} design={design} />
        </div>
      ))}
    </>
  );
}
