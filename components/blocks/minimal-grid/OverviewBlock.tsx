import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { OverviewData } from "@/lib/types";

interface OverviewBlockProps {
  data: OverviewData;
}

export default function OverviewBlock({ data }: OverviewBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader />
      <div className="mt-8">
        <SectionHeader title="Overview" />
      </div>

      <div {...editableRegion("itinerarySnapshotText", "multiline")} className="mt-6 flex flex-col">
        {data.days.map((day) => (
          <div key={day.dayNumber} className="border-t border-[var(--design-secondary,#68727d)]/20 py-3 first:border-t-0">
            <p className="text-sm font-bold">
              Day {day.dayNumber}
              <span className="ml-2 font-normal text-[var(--design-secondary,#68727d)]">{day.date}</span>
            </p>
            <ul className="mt-1 space-y-0.5">
              {day.activities.map((activity, index) => (
                <li key={index} className="text-sm">
                  {activity.time && <span className="mr-2 font-semibold">{activity.time}</span>}
                  {activity.description}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
