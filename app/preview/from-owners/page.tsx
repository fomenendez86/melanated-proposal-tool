import FromOwnersBlock from "@/components/blocks/FromOwnersBlock";
import type { FromOwnersData } from "@/lib/types";

const testData: FromOwnersData = {
  paragraphs: [
    "We started Melanated Safaris in January 2022 with a passion for sharing the beauty of Africa, and we've built this company from the ground up with love and dedication. Thank you from the bottom of our hearts for considering us for your journey—we know you have choices, and it's an honor to be part of your adventure.",
    "What sets us apart isn't just our expertise in safaris; it's our deep commitment to creating authentic, next-generation experiences rooted in African culture, breathtaking landscapes, and heartfelt hospitality. Every trip we plan is designed with care, uplifting local communities while ensuring your journey is seamless, personalized, and unforgettable.",
    "With Melanated Safaris, it's more than a safari—it's a connection to Africa that will stay with you forever. We can't wait to welcome you!",
  ],
  founders: [
    { name: "Antoine D. Wilson", title: "Co-Founder | CEO" },
    { name: "Okello Jao", title: "Co-Founder | Director of Safari Operations" },
  ],
  photoUrl: "https://picsum.photos/id/1043/800/450",
  pageNumber: 2,
};

export default function FromOwnersPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <FromOwnersBlock data={testData} />
    </div>
  );
}
