import TwoColumnListBlock from "@/components/blocks/TwoColumnListBlock";
import type { TwoColumnListData } from "@/lib/types";

const testData: TwoColumnListData = {
  title: "Exclusions",
  leftColumn: [
    {
      heading: "International Airfare",
      lines: ["Flight to and from Tanzania"],
    },
    {
      heading: "Tourist Visa",
      lines: [
        "US Citizens – $100 USD",
        "Other Nationalities – $50 USD",
        "Please visit https://immigration.go.tz",
        "to verify if a visa is required for",
        "citizens of your country",
      ],
    },
    {
      heading: "Zanzibar Travel Insurance",
      lines: [
        "Mandatory requirement and can",
        "only be purchased from the",
        "Zanzibar Insurance",
        "Corporation(ZIC)",
      ],
    },
  ],
  rightColumn: [
    {
      heading: "Tips and Gratuity",
      lines: ["Optional; suggested $20", "per day"],
    },
    {
      heading: "Travel Insurance",
      lines: [
        "Optional but recommended for",
        "unexpected emergencies.  This",
        "policy does not supercede the",
        "required Zanzibar travel",
        "insurance.",
      ],
    },
  ],
  pageNumber: 31,
};

export default function ExclusionsPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <TwoColumnListBlock data={testData} />
    </div>
  );
}
