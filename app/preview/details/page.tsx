import DetailsBlock from "@/components/blocks/DetailsBlock";
import type { DetailsData } from "@/lib/types";

const testData: DetailsData = {
  rows: [
    { label: "Package Booked:", value: "The Mainland Tour" },
    { label: "Selected Tier:", value: "Classic" },
    { label: "Dates:", value: "???" },
    { label: "Passenger Manifest:", value: "???" },
    { label: "Special Occasion:", value: "TBD" },
    {
      label: "Airport Information",
      value: "Arrival(JRO - Mt. Kilimanjaro); Departure(ZNZ - Zanzibar)",
      emphasis: true,
    },
    { label: "Package Total:", value: "???" },
  ],
  pageNumber: 3,
};

export default function DetailsPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <DetailsBlock data={testData} />
    </div>
  );
}
