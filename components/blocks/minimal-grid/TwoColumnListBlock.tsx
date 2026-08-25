import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { TwoColumnListData } from "@/lib/types";

interface TwoColumnListBlockProps {
  data: TwoColumnListData;
}

function ListColumn({
  sections,
  field,
}: {
  sections: TwoColumnListData["leftColumn"];
  field: "leftListText" | "rightListText";
}) {
  return (
    <div {...editableRegion(field, "multiline")} className="flex-1 space-y-6">
      {sections.map((section, index) => (
        <div key={index}>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">{section.heading}</p>
          {section.lines.map((line, lineIndex) => (
            <p key={lineIndex} className="mt-1 text-sm">{line}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TwoColumnListBlock({ data }: TwoColumnListBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div className="mt-6">
        <SectionHeader title={data.title} />
      </div>

      <div className="mt-10 flex gap-16">
        <ListColumn sections={data.leftColumn} field="leftListText" />
        <ListColumn sections={data.rightColumn} field="rightListText" />
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
