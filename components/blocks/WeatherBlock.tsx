import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import type { WeatherData, WeatherTable } from "@/lib/types";

interface WeatherBlockProps {
  data: WeatherData;
}

function WeatherTableSection({ table }: { table: WeatherTable }) {
  return (
    <div>
      <h2 className="text-center text-3xl font-bold uppercase tracking-widest">
        {table.title}
      </h2>
      <div className="mt-6 grid grid-cols-4 gap-4 text-center">
        {table.seasons.map((season, index) => (
          <div key={index}>
            <p className="text-lg font-bold uppercase tracking-wide">
              {season.icon && <span className="mr-1">{season.icon}</span>}
              {season.name}
            </p>
            <p className="mt-2 text-xs font-bold uppercase">
              {season.months}
            </p>
            <p className="mt-1 text-xs font-bold">{season.tempF}</p>
            <p className="text-xs font-bold">{season.tempC}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed">
        {table.note}
      </p>
    </div>
  );
}

export default function WeatherBlock({ data }: WeatherBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader variant="proposalOnly" />

      <div className="mt-16 flex flex-col gap-16">
        {data.tables.map((table, index) => (
          <WeatherTableSection key={index} table={table} />
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
