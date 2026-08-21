import ThankYouBlock from "@/components/blocks/ThankYouBlock";
import type { ThankYouData } from "@/lib/types";

const testData: ThankYouData = {
  message: "thank you",
  imageUrl: "https://picsum.photos/id/1044/600/1100",
  pageNumber: 39,
};

export default function ThankYouPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <ThankYouBlock data={testData} />
    </div>
  );
}
