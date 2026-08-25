import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { TransportDetailsData } from "@/lib/types";

interface TransportDetailsBlockProps {
  data: TransportDetailsData;
}

export default function TransportDetailsBlock({ data }: TransportDetailsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]">
      <PageHeader variant="proposalOnly" />

      <div className="mt-2">
        <SectionHeader title="Ground Transportation" />
      </div>

      <div className="mt-8 flex flex-col">
        {data.legs.map((leg, index) => (
          <div key={index} className="border-b border-neutral-200 py-4 first:pt-0">
            <p className="text-sm font-bold uppercase tracking-wide">{leg.mode || "Transportation"}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <p><span className="font-semibold">Route:</span> {[leg.pickupLocation, leg.dropoffLocation].filter(Boolean).join(" → ") || "—"}</p>
              <p><span className="font-semibold">Vehicle:</span> {leg.vehicleType || "—"}</p>
              <p><span className="font-semibold">Scheduled:</span> {leg.scheduledLabel || "—"}</p>
            </div>
            {leg.description ? <p className="mt-2 text-sm text-neutral-600">{leg.description}</p> : null}
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
