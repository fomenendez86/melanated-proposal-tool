import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { FlightDetailsData } from "@/lib/types";

interface FlightDetailsBlockProps {
  data: FlightDetailsData;
}

export default function FlightDetailsBlock({ data }: FlightDetailsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]">
      <PageHeader variant="proposalOnly" />

      <div className="mt-2">
        <SectionHeader title="Flights" />
      </div>

      <div className="mt-8 flex flex-col">
        {data.legs.map((leg, index) => (
          <div key={index} className="border-b border-neutral-200 py-4 first:pt-0">
            <p className="text-sm font-bold uppercase tracking-wide">
              {[leg.carrier, leg.flightNumber].filter(Boolean).join(" ") || "Flight"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <p><span className="font-semibold">Route:</span> {[leg.originAirport, leg.destinationAirport].filter(Boolean).join(" → ") || "—"}</p>
              <p><span className="font-semibold">Cabin:</span> {leg.cabinClass || "—"}</p>
              <p><span className="font-semibold">Departure:</span> {leg.departureLabel || "—"}</p>
              <p><span className="font-semibold">Arrival:</span> {leg.arrivalLabel || "—"}</p>
            </div>
            {leg.notes ? <p className="mt-2 text-sm text-neutral-600">{leg.notes}</p> : null}
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
