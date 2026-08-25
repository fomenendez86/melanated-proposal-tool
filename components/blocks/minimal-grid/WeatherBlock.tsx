import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { WeatherData, WeatherTable } from "@/lib/types";

interface WeatherBlockProps {
  data: WeatherData;
}

function WeatherTableSection({ table }: { table: WeatherTable }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--design-secondary,#68727d)]">{table.title}</h2>
      <div className="mt-4 grid grid-cols-4 gap-4 border-t border-[var(--design-secondary,#68727d)]/20 pt-4 text-center">
        {table.seasons.map((season, index) => (
          <div key={index}>
            <p className="text-sm font-bold uppercase tracking-tight">
              {season.icon && <span className="mr-1">{season.icon}</span>}
              {season.name}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase text-[var(--design-secondary,#68727d)]">{season.months}</p>
            <p className="mt-1 text-xs font-bold">{season.tempF}</p>
            <p className="text-xs text-[var(--design-secondary,#68727d)]">{season.tempC}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--design-secondary,#68727d)]">{table.note}</p>
    </div>
  );
}

export default function WeatherBlock({ data }: WeatherBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div {...editableRegion("weatherSnapshotText", "multiline")} className="mt-16 flex flex-col gap-16">
        {data.tables.map((table, index) => (
          <WeatherTableSection key={index} table={table} />
        ))}
      </div>
      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
