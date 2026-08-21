import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { KeyValueLine, PricingData } from "@/lib/types";

interface PricingBlockProps {
  data: PricingData;
}

function KeyValueList({
  lines,
  className = "",
}: {
  lines: KeyValueLine[];
  className?: string;
}) {
  return (
    <ul className={`list-disc space-y-1 pl-4 text-sm ${className}`}>
      {lines.map((line, index) => (
        <li key={index}>
          <span className="font-bold">{line.label}: </span>
          {line.value}
        </li>
      ))}
    </ul>
  );
}

export default function PricingBlock({ data }: PricingBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader />

      <div className="mt-8">
        <SectionHeader title="Pricing and Payment Information" />
      </div>

      <h1 className="mt-8 text-center text-3xl font-bold uppercase tracking-widest">
        Pricing and Payment Information
      </h1>

      <p className="mt-8 text-sm leading-relaxed">{data.intro}</p>

      <div className="mt-6">
        <p className="text-sm font-bold underline">Package Pricing:</p>
        <KeyValueList lines={data.packagePricing} className="mt-2 text-[#ff0000]" />
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold underline">Payment Schedule:</p>
        <KeyValueList lines={data.paymentSchedule} className="mt-2 text-[#ff0000]" />
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold">Banking Information:</p>
        <KeyValueList lines={data.bankingInfo} className="mt-2" />
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
