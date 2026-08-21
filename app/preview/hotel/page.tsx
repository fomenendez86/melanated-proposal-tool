import HotelBlock from "@/components/blocks/HotelBlock";
import type { HotelData } from "@/lib/types";

const testData: HotelData = {
  name: "Under the Shade Safari Lodge",
  roomCategory: "Standard",
  mealPlan: "Half Board",
  description:
    "Nestled in the heart of Tanzania's wild beauty, Under the Shade Safari Lodge offers an intimate and immersive bush experience on the edge of a private game reserve. Surrounded by acacia woodlands and expansive savannah, the lodge blends rustic elegance with modern comfort. Guests stay in spacious, eco-friendly tents or thatched cottages, each offering sweeping views of the African plains and the chance to spot wildlife right from their veranda. With locally inspired cuisine, guided game drives, and sundowners by the firepit, it's the perfect retreat for those seeking connection with nature, luxury under canvas, and the untamed spirit of safari life.",
  images: {
    topRight: "https://picsum.photos/id/1015/700/450",
    bottomLeftTop: "https://picsum.photos/id/1018/500/300",
    bottomLeftBottom: "https://picsum.photos/id/1016/500/700",
  },
};

export default function HotelPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <HotelBlock data={testData} />
    </div>
  );
}
