import CityToursDividerBlock from "@/components/blocks/CityToursDividerBlock";
import type { CityToursDividerData } from "@/lib/types";

const testData: CityToursDividerData = {
  city: "Arusha",
  intro:
    'Arusha, often referred to as the "Safari Capital of Tanzania," offers a wide range of tours and excursions that allow you to experience the best of both nature and culture. Whether you\'re seeking thrilling wildlife adventures or a deep dive into the region\'s rich heritage, Arusha has something for everyone. You can explore the stunning landscapes of nearby national parks like Serengeti, Ngorongoro Crater, and Tarangire, or visit cultural landmarks such as the Maasai villages and local markets.',
  priceNote: "Prices are per adult(Ages 13+); children 5-12 years are 50% off",
  imageUrl: "https://picsum.photos/id/1082/900/700",
  pageNumber: 21,
};

export default function CityToursPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <CityToursDividerBlock data={testData} />
    </div>
  );
}
