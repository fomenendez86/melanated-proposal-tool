import ImportantItemsBlock from "@/components/blocks/ImportantItemsBlock";
import type { ImportantItemsData } from "@/lib/types";

const testData: ImportantItemsData = {
  pageNumber: 33,
  rows: [
    {
      icon: "🛂",
      swatchColor: "#dbcfad",
      heading: "Passport",
      bullets: [
        "Ensure you have at least 6 months validity",
        "Double-check that the name on your passport matches your travel documents (flights, reservations, etc.).",
        "Keep a photocopy or digital copy of your passport in a separate location in case it's lost or stolen.",
        "Ensure your passport has at least two blank visa pages.",
      ],
    },
    {
      icon: "🪪",
      swatchColor: "#e8ceb0",
      heading: "Visas",
      bullets: [
        "USA Citizens: Multiple Entry Visa Required ($100 USD Cash Only)",
        "All other Nations: Ordinary Visa ($50 USD Cash Only)",
        "Visa free?: Check https://immigration.go.tz",
      ],
    },
    {
      icon: "🐚",
      swatchColor: "#b0b0b0",
      heading: "Zanzibar Travel Insurance",
      bullets: [
        "Effective Oct. 1, 2024 - Required for ALL foreign visitors to the island of Zanzibar",
        "Insurance can ONLY be purchased from the Zanzibar Insurance Corp.",
        "Visit https://visitzanzibar.go.tz",
      ],
      qrCodeUrl: "https://visitzanzibar.go.tz",
    },
  ],
};

export default function ImportantItemsPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <ImportantItemsBlock data={testData} />
    </div>
  );
}
