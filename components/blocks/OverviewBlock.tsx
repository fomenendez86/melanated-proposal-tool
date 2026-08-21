import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { OverviewData } from "@/lib/types";

interface OverviewBlockProps {
  data: OverviewData;
}

export default function OverviewBlock({ data }: OverviewBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader />

      <div className="mt-8">
        <SectionHeader title="Overview" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {data.days.map((day) => (
          <div key={day.dayNumber}>
            <p className="text-sm font-bold">
              Day {day.dayNumber}:
              <span className="ml-2 inline-block">{day.date}</span>
            </p>
            <ul className="mt-1 space-y-0.5">
              {day.activities.map((activity, index) => (
                <li key={index} className="text-sm">
                  {"- "}
                  {activity.time && `${activity.time}:`}
                  <span
                    className={
                      activity.time ? "ml-2 inline-block" : "inline-block"
                    }
                  >
                    {activity.description}
                  </span>
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
