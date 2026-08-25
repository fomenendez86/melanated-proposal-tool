import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { TermsConditionsData } from "@/lib/types";

interface TermsConditionsBlockProps {
  data: TermsConditionsData;
}

export default function TermsConditionsBlock({ data }: TermsConditionsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader />
      <div className="mt-8">
        <SectionHeader title="Terms and Conditions" />
      </div>

      {data.showTitle && (
        <h1 className="mt-8 text-3xl font-bold uppercase tracking-tight">Terms &amp; Conditions</h1>
      )}

      <div {...editableRegion("termsSnapshotText", "multiline")} className="mt-8 flex flex-col gap-5">
        {data.sections.map((section, index) => (
          <div key={index}>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">{section.heading}</p>
            <div className="mt-1 space-y-3">
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="whitespace-pre-line text-sm">{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
