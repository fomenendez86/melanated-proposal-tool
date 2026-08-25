import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { DayEntry, DayItineraryData } from "@/lib/types";

interface DayItineraryBlockProps {
  data: DayItineraryData;
}

function DayColumn({ day }: { day: DayEntry }) {
  return (
    <div className="flex-1">
      <h2 className="text-2xl font-bold uppercase tracking-tight">Day {day.dayNumber}</h2>
      {day.subtitle && (
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">{day.subtitle}</p>
      )}
      <div className="mt-4 flex flex-col gap-3">
        {day.imageUrls.filter(Boolean).map((url, index) => (
          <div key={index} className="border border-[var(--design-secondary,#68727d)]/25 p-2">
            <img src={url} alt={`Day ${day.dayNumber}`} className="h-[170px] w-full object-cover" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {day.highlightLine && <p className="font-bold">{day.highlightLine}</p>}
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
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div className="mt-6">
        <SectionHeader title="Itinerary" />
      </div>

      <div {...editableRegion("itinerarySnapshotText", "multiline")} className="mt-6 flex gap-10">
        {data.days.map((day) => (
          <DayColumn key={day.dayNumber} day={day} />
        ))}

        {showSidebar && (
          <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-3 self-stretch border border-[var(--design-accent,#d8c8a8)] text-center">
            <span className="[writing-mode:vertical-rl] whitespace-nowrap text-sm font-bold uppercase tracking-[0.15em]">
              Karibu Tanzania
            </span>
          </div>
        )}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
