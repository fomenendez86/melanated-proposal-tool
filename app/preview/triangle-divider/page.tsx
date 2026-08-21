import TriangleDividerBlock from "@/components/blocks/TriangleDividerBlock";
import type { TriangleDividerData } from "@/lib/types";

const testData: TriangleDividerData = {
  sectionLabel: "Accommodations",
  titleLines: [
    { text: "Under the Shade", style: "bold" },
    { text: "Safari Lodge", style: "script" },
  ],
  imageUrl: "https://picsum.photos/id/1016/800/500",
  pageNumber: 7,
};

export default function TriangleDividerPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <TriangleDividerBlock data={testData} />
    </div>
  );
}
