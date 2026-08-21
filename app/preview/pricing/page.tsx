import PricingBlock from "@/components/blocks/PricingBlock";
import type { PricingData } from "@/lib/types";

const testData: PricingData = {
  intro:
    "At Melanated Safaris, we make it easy for groups to manage payments with a convenient three-installment plan. All payments can be made securely via bank wire. Below, you'll find the payment schedule, with dates for each installment to ensure your trip arrangements stay on track. For your convenience, our banking information is provided at the end of this section.",
  packagePricing: [
    { label: "Invoice Total", value: "$11,842.35" },
    { label: "Commission", value: "$1,153.35." },
    { label: "Amount Due", value: "$10,688.65." },
  ],
  paymentSchedule: [
    { label: "First Installment", value: "€500 deposit per person due at booking" },
    { label: "Second Installment", value: "August 03, 2025" },
    { label: "Final Installment", value: "November 03, 2025" },
  ],
  bankingInfo: [
    { label: "Bank Name", value: "Citibank N.A." },
    { label: "Beneficiary Name", value: "MELANATED SAFARIS LLC" },
    { label: "SWIFT Code(Intl.)", value: "CITIUS33" },
    { label: "Routing Number(USA)", value: "266086554" },
    { label: "Account Number", value: "9154236745" },
    { label: "Company Address", value: "2212 NW 91st #1239 Miami, FL 33147" },
  ],
  pageNumber: 32,
};

export default function PricingPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <PricingBlock data={testData} />
    </div>
  );
}
