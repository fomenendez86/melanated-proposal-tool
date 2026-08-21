import TwoColumnListBlock from "@/components/blocks/TwoColumnListBlock";
import type { TwoColumnListData } from "@/lib/types";

const testData: TwoColumnListData = {
  title: "Inclusions",
  leftColumn: [
    {
      heading: "Ground Transportation",
      lines: [
        "All transfers to and from",
        "the airport and excursions",
        "listed on the itinerary",
      ],
    },
    {
      heading: "Hotel Accommodations",
      lines: [
        "2D/1N - at Arumeru River Lodge",
        "3D/2N - at Lake Burunge Baobab Lodge",
        "2D/1N - at Ngorongoro Farm House",
        "3D/2N - at Grumeti Hills",
        "3D/2N - at Anantya Serengeti",
        "5D/4N - at Nungwi Beach by Turaco",
      ],
    },
    {
      heading: "All Meals",
      lines: ["All-Inclusive:(Breakfast, Lunch,", "and Dinner)"],
    },
  ],
  rightColumn: [
    {
      heading: "Domestic Flight",
      lines: ["Flight to and from mainland", "for safari"],
    },
    {
      heading: "Tarangire National Park & Serengeti National Park",
      lines: ["All park fees & concessions"],
    },
    {
      heading: "Safari Pack",
      lines: ["A thank you gift from", "Melanated Safaris"],
    },
  ],
  pageNumber: 30,
};

export default function InclusionsPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <TwoColumnListBlock data={testData} />
    </div>
  );
}
