import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { OverviewData } from "@/lib/types";

interface OverviewBlockProps {
  data: OverviewData;
}

export default function OverviewBlock({ data }: OverviewBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wide">
        <div className="text-left font-semibold">Melanated Safaris</div>
        <div className="text-right">Proposal</div>
      </div>

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

      <div className="absolute inset-x-0 bottom-8 text-center text-xs text-neutral-600">
        04
      </div>
    </div>
  );
}
