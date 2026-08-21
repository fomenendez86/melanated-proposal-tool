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
import TermsConditionsBlock from "@/components/blocks/TermsConditionsBlock";
import ThankYouBlock from "@/components/blocks/ThankYouBlock";
import TriangleDividerBlock from "@/components/blocks/TriangleDividerBlock";
import TwoColumnListBlock from "@/components/blocks/TwoColumnListBlock";
import WeatherBlock from "@/components/blocks/WeatherBlock";
import type { ProposalData, ProposalSection } from "@/lib/types";

export function ProposalSectionView({ section }: { section: ProposalSection }) {
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
  }
}

interface ProposalRendererProps {
  data: ProposalData;
}

export default function ProposalRenderer({ data }: ProposalRendererProps) {
  return (
    <>
      {data.sections.map((section, index) => (
        <div
          key={index}
          style={{
            breakAfter: index < data.sections.length - 1 ? "page" : "auto",
          }}
        >
          <ProposalSectionView section={section} />
        </div>
      ))}
    </>
  );
}
