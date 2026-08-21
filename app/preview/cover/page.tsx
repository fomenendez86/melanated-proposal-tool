import CoverBlock from "@/components/blocks/CoverBlock";
import type { CoverData } from "@/lib/types";

const testData: CoverData = {
  title: "Proposal",
  subtitle: "An Unforgettable Tanzanian Experience For",
  clientLine: "Replace with Company Name or Clients",
  imageUrl: "https://picsum.photos/id/1069/700/1100",
};

export default function CoverPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <CoverBlock data={testData} />
    </div>
  );
}
