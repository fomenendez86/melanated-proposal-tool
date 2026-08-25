import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import type { FlightDetailsData } from "@/lib/types";

interface FlightDetailsBlockProps {
  data: FlightDetailsData;
}

export default function FlightDetailsBlock({ data }: FlightDetailsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div className="mt-6">
        <SectionHeader title="Flights" />
      </div>

      <div className="mt-8 flex flex-col">
        {data.legs.map((leg, index) => (
          <div key={index} className="border-t border-[var(--design-secondary,#68727d)]/20 py-4 first:border-t-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">
              {[leg.carrier, leg.flightNumber].filter(Boolean).join(" ") || "Flight"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <p><span className="text-[var(--design-secondary,#68727d)]">Route</span> · {[leg.originAirport, leg.destinationAirport].filter(Boolean).join(" → ") || "—"}</p>
              <p><span className="text-[var(--design-secondary,#68727d)]">Cabin</span> · {leg.cabinClass || "—"}</p>
              <p><span className="text-[var(--design-secondary,#68727d)]">Departure</span> · {leg.departureLabel || "—"}</p>
              <p><span className="text-[var(--design-secondary,#68727d)]">Arrival</span> · {leg.arrivalLabel || "—"}</p>
            </div>
            {leg.notes ? <p className="mt-2 text-sm text-[var(--design-secondary,#68727d)]">{leg.notes}</p> : null}
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
