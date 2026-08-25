import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { TermsConditionsData } from "@/lib/types";

interface TermsConditionsBlockProps {
  data: TermsConditionsData;
}

export default function TermsConditionsBlock({
  data,
}: TermsConditionsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]">
      <PageHeader />

      <div className="mt-8">
        <SectionHeader title="Terms and Conditions" />
      </div>

      {data.showTitle && (
        <h1 className="mt-8 text-center font-serif text-4xl italic">
          Terms &amp; Conditions
        </h1>
      )}

      <div {...editableRegion("termsSnapshotText", "multiline")} className="mt-8 flex flex-col gap-5">
        {data.sections.map((section, index) => (
          <div key={index}>
            <p className="text-sm font-bold">{section.heading}</p>
            <div className="mt-1 space-y-3">
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="whitespace-pre-line text-sm">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
