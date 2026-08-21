import DayItineraryBlock from "@/components/blocks/DayItineraryBlock";
import type { DayItineraryData } from "@/lib/types";

const testData: DayItineraryData = {
  pageNumber: 15,
  days: [
    {
      dayNumber: 2,
      subtitle: "Serval Wildlife & Coffee Tour",
      paragraphs: [
        "Experience the wild like never before as you get up close with exotic animals at the renowned Serval Wildlife sanctuary. Then, breathe in the rich aromas of freshly roasted beans as you stroll through a lush coffee estate nestled in the highlands.",
        "From majestic wildlife encounters to the art of coffee cultivation, this tour blends nature, culture, and flavor into one unforgettable adventure. It's an inspiring escape into Tanzania's wild soul and aromatic heritage.",
      ],
      imageUrls: [
        "https://picsum.photos/id/1074/500/280",
        "https://picsum.photos/id/1069/500/280",
      ],
    },
    {
      dayNumber: 3,
      subtitle: "Walking Safari: Arusha National Park",
      paragraphs: [
        "Spend the day experiencing Arusha National Park from a whole new perspective — on foot. Led by an expert ranger, your walking safari begins in the shadow of Mount Meru, where you'll quietly explore the park's lush forests and open clearings.",
        "Keep your eyes peeled for giraffes gracefully browsing nearby, herds of buffalo, warthogs trotting through the grass, and the elusive colobus monkeys swinging through the canopy above.",
      ],
      imageUrls: ["https://picsum.photos/id/1080/500/280"],
    },
  ],
};

export default function DayItineraryPreviewPage2() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <DayItineraryBlock data={testData} />
    </div>
  );
}
