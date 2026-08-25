import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { FromOwnersData } from "@/lib/types";

interface FromOwnersBlockProps {
  data: FromOwnersData;
}

export default function FromOwnersBlock({ data }: FromOwnersBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader />
      <div className="mt-8">
        <SectionHeader title="From the Owners" />
      </div>

      <div className="mt-10 grid grid-cols-[1fr_260px] gap-10">
        <div>
          <div {...editableRegion("ownerParagraphsText", "multiline")} className="space-y-4 text-sm leading-6">
            {data.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div {...editableRegion("founderSignaturesText", "multiline")} className="mt-10 flex gap-16 border-t border-[var(--design-secondary,#68727d)]/25 pt-6">
            {data.founders.map((founder, index) => (
              <div key={index}>
                <p className="text-sm font-bold">{founder.name}</p>
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--design-secondary,#68727d)]">{founder.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[var(--design-secondary,#68727d)]/25 p-2">
          <img
            {...editableRegion("ownerPhotoUrl", "image")}
            src={data.photoUrl || undefined}
            alt="Team"
            className="h-[420px] w-full object-cover"
          />
        </div>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
