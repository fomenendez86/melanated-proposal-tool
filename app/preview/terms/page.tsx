import TermsConditionsBlock from "@/components/blocks/TermsConditionsBlock";
import type { TermsConditionsData } from "@/lib/types";

const testData: TermsConditionsData = {
  showTitle: true,
  pageNumber: 35,
  sections: [
    {
      heading: "Reservation and Payment Policy",
      paragraphs: [
        "a. A non-refundable deposit of $500 per person is required to secure a booking.\nb. Full payment is due no later than 60 days prior to the safari departure date.\nc. For bookings made less than 60 days prior to the safari departure date, full payment is required to secure the booking.\nd. Payment can be made by bank transfer or credit card.",
      ],
    },
    {
      heading: "Amendment Policy",
      paragraphs: [
        "Guests may make amendments, such as name changes, or add additional guests, on a previously booked package and accept the following:",
        "a. You are subject to a new rate based on the current hotel/lodge rates at the time of the modification.\nb. You may be subject to modification fees from our supplier partners to alter originally confirmed bookings.",
      ],
    },
    {
      heading: "Cancellation Policy",
      paragraphs: [
        "a. Due to recent changes in many of our suppliers policies, ALL payments are NON-REFUNDABLE, nor are trips exchangeable for an alternate date. Upon payment, our reservation team promptly secures your accommodations. Once transactions are processed, we regretfully cannot retrieve funds, necessitating this adjustment in our policy.",
        "We strongly recommend purchasing travel insurance for added protection AND to cover any unexpected cancellations.",
      ],
    },
  ],
};

export default function TermsPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <TermsConditionsBlock data={testData} />
    </div>
  );
}
