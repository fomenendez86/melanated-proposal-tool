import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { DayEntry, DayItineraryData } from "@/lib/types";

interface DayItineraryBlockProps {
  data: DayItineraryData;
}

function DayColumn({ day }: { day: DayEntry }) {
  return (
    <div className="flex-1">
      <h2 className="text-3xl font-bold uppercase leading-none">
        Day {day.dayNumber}
      </h2>
      {day.subtitle && (
        <div className="mt-3 inline-block bg-black px-3 py-1 text-sm font-bold uppercase text-white">
          {day.subtitle}
        </div>
      )}
      <div className="mt-4 flex flex-col gap-3">
        {day.imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Day ${day.dayNumber}`}
            className="h-[180px] w-full object-cover"
          />
        ))}
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {day.highlightLine && (
          <p className="font-bold">{day.highlightLine}</p>
        )}
        {day.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

export default function DayItineraryBlock({ data }: DayItineraryBlockProps) {
  const showSidebar = Boolean(data.showWelcomeSidebar);

  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader variant="proposalOnly" />

      <div className="mt-2">
        <SectionHeader title="Itinerary" />
      </div>

      <div {...editableRegion("itinerarySnapshotText", "multiline")} className="mt-6 flex gap-10">
        {data.days.map((day) => (
          <DayColumn key={day.dayNumber} day={day} />
        ))}

        {showSidebar && (
          <div className="relative w-16 shrink-0 self-stretch overflow-hidden bg-[#1c202b] text-white">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <span className="whitespace-nowrap text-lg font-bold uppercase tracking-wide [writing-mode:vertical-rl]">
                Karibu Tanzania
              </span>
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] [writing-mode:vertical-rl]">
                Welcome
              </span>
            </div>
          </div>
        )}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
