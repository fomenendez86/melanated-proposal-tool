import type { ComponentType, ReactNode } from "react";

import { editableRegion } from "@/lib/editor/editableRegions";
import type { ItineraryDay, OverviewData } from "@/lib/types";

// Owns the wrapper geometry, the single editableRegion("itinerarySnapshotText")
// wrapper, and the day-list iteration — the part of OverviewBlock that's
// identical between designs. Per-day/per-activity markup genuinely differs
// (Safari Editorial: "Day N:" + "- " bullet prefix, no divider; Minimal
// Grid: "Day N" + hairline divider between days, bold time prefix) so it
// stays a render prop instead of being forced into one shared shape.
export interface OverviewBlockLayoutProps {
  data: OverviewData;
  pageClassName: string;
  header: ReactNode;
  contentClassName: string;
  renderDay: (day: ItineraryDay) => ReactNode;
  PageFooter: ComponentType<{ pageNumber: number }>;
}

export default function OverviewBlockLayout({
  data,
  pageClassName,
  header,
  contentClassName,
  renderDay,
  PageFooter,
}: OverviewBlockLayoutProps) {
  return (
    <div className={pageClassName}>
      {header}

      <div {...editableRegion("itinerarySnapshotText", "multiline")} className={contentClassName}>
        {data.days.map((day) => (
          <div key={day.dayNumber}>{renderDay(day)}</div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
