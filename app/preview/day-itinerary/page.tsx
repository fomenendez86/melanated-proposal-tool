import DayItineraryBlock from "@/components/blocks/DayItineraryBlock";
import type { DayItineraryData } from "@/lib/types";

const testData: DayItineraryData = {
  pageNumber: 14,
  showWelcomeSidebar: true,
  days: [
    {
      dayNumber: 1,
      highlightLine: "🌍 Welcome to Tanzania! 🌍",
      paragraphs: [
        "You are the heart of what we do, and it's an absolute honor to have you with us. On behalf of the entire Melanated Safaris family, we'd like to warmly welcome you to the beautiful country of Tanzania. Our dedicated staff will be eagerly awaiting your arrival to greet you with a heartfelt African welcome to the Motherland. From there, you'll be transported in comfort to your accommodations where your journey of unforgettable experiences begins.",
      ],
      imageUrls: ["https://picsum.photos/id/1025/500/450"],
    },
  ],
};

export default function DayItineraryPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <DayItineraryBlock data={testData} />
    </div>
  );
}
