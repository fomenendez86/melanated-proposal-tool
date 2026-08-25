import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { ThankYouData } from "@/lib/types";

interface ThankYouBlockProps {
  data: ThankYouData;
}

export default function ThankYouBlock({ data }: ThankYouBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] overflow-hidden bg-[#f7f5f0] text-[var(--design-primary,#20252b)]">
      <div className="px-[82px] pt-12">
        <PageHeader variant="labelOnly" />
      </div>

      <div className="absolute inset-y-12 right-[82px] w-[38%] border border-[var(--design-secondary,#68727d)]/25 p-2">
        <img
          {...editableRegion("sectionImageUrl", "image")}
          src={data.imageUrl || undefined}
          alt="Thank you"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute left-[82px] top-1/2 w-[48%] -translate-y-1/2">
        <span className="block h-px w-12 bg-[var(--design-accent,#d8c8a8)]" />
        <p {...editableRegion("thankYouMessage", "multiline")} className="mt-4 text-3xl font-bold leading-tight">{data.message}</p>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
