import SectionDividerBlock from "@/components/blocks/SectionDividerBlock";
import type { SectionDividerData } from "@/lib/types";

const testData: SectionDividerData = {
  title: "EXCURSIONS",
  subtitle: "TAKE YOUR ADVENTURE TO THE NEXT LEVEL!",
  imageUrl: "https://picsum.photos/id/1080/520/400",
  pageNumber: 20,
};

export default function SectionDividerPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <SectionDividerBlock data={testData} />
    </div>
  );
}
