import ExcursionListBlock from "@/components/blocks/ExcursionListBlock";
import type { ExcursionListData } from "@/lib/types";

const testData: ExcursionListData = {
  items: [
    {
      title: "Walking Safari at Arusha National Park",
      description:
        "A walking safari at Arusha National Park offers a unique, up-close adventure through diverse landscapes, allowing you to experience the park's wildlife, stunning views of Mount Meru, and rich ecosystems from the ground level.",
      price: "$200",
      imageUrl: "https://picsum.photos/seed/arusha-safari/600/400",
    },
    {
      title: "Coffee Tour w/Chagga Tribe",
      description:
        "Explore the Chagga coffee farms in the foothills of Mount Kilimanjaro, where you'll learn about the region's rich coffee-making traditions from local guides of the Chagga tribe.",
      price: "$80",
      imageUrl: "https://picsum.photos/seed/chagga-coffee/600/400",
    },
    {
      title: "Chemka Springs",
      description:
        "Chemka Springs is a tranquil natural oasis with crystal-clear turquoise waters, nestled in the foothills of Kilimanjaro, offering a perfect escape surrounded by lush greenery and volcanic rocks.",
      price: "$80",
      imageUrl: "https://picsum.photos/seed/chemka-springs/600/400",
    },
    {
      title: "Serval Wildlife",
      description:
        "Serval Wildlife is a unique experience where you can get up close to nature, feeding and interacting with animals like zebras, giraffes, and wildebeests in their natural habitat.",
      price: "$150",
      imageUrl: "https://picsum.photos/seed/serval-wildlife/600/400",
    },
  ],
};

export default function ExcursionsPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <ExcursionListBlock data={testData} />
    </div>
  );
}
