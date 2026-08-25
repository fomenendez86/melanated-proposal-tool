import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { TriangleDividerData } from "@/lib/types";

interface TriangleDividerBlockProps {
  data: TriangleDividerData;
}

const TITLE_LINE_FIELDS = ["titleLine1", "titleLine2", "titleLine3"] as const;

/** "clean-title" variant: a hairline rule with a left-aligned title block, no image. */
export default function TriangleDividerBlock({ data }: TriangleDividerBlockProps) {
  return (
    <div className="relative box-border flex h-[1056px] w-[816px] flex-col bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div className="mt-6">
        <SectionHeader title={data.sectionLabel} titleRegionProps={editableRegion("sectionLabel")} />
      </div>

      <div className="mb-auto mt-auto border-t border-[var(--design-accent,#d8c8a8)] pt-8">
        {data.titleLines.map((line, index) => (
          <p
            key={index}
            {...(index < TITLE_LINE_FIELDS.length ? editableRegion(TITLE_LINE_FIELDS[index]) : {})}
            className="text-6xl font-bold uppercase leading-tight"
          >
            {line.text}
          </p>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
