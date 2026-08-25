import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { DetailsData } from "@/lib/types";

interface DetailsBlockProps {
  data: DetailsData;
}

export default function DetailsBlock({ data }: DetailsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div className="mt-6">
        <SectionHeader title="The Details" />
      </div>

      <div className="mt-8 flex flex-col">
        {data.rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[180px_1fr] gap-6 border-t border-[var(--design-secondary,#68727d)]/20 py-4 first:border-t-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">
              {row.label}
            </div>
            <div
              {...(row.editField ? editableRegion(row.editField) : {})}
              className={`text-sm ${row.emphasis ? "font-bold" : ""}`}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
