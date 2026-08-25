import BrandIcon from "@/components/blocks/shared/BrandIcon";
import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { CityToursDividerData } from "@/lib/types";

interface CityToursDividerBlockProps {
  data: CityToursDividerData;
}

export default function CityToursDividerBlock({ data }: CityToursDividerBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] text-[var(--design-primary,#20252b)]">
      <div className="px-[82px] pt-12">
        <div className="flex items-center justify-between border-b border-[var(--design-secondary,#68727d)]/25 pb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--design-secondary,#68727d)]">
          <BrandWordmark />
          <span>Proposal</span>
        </div>

        <div className="mt-8 border border-[var(--design-secondary,#68727d)]/25 p-2">
          <img
            {...editableRegion("sectionImageUrl", "image")}
            src={data.imageUrl || undefined}
            alt={data.city}
            className="h-[480px] w-full object-cover"
          />
        </div>

        <div className="mt-6 flex items-baseline gap-4">
          <h1 className="text-5xl font-bold uppercase leading-none">{data.city}</h1>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--design-secondary,#68727d)]">
            Tours &amp; Excursions <BrandIcon slot="globe" className="inline-block size-4 align-middle" />
          </p>
        </div>

        <p {...editableRegion("cityIntro", "multiline")} className="mt-4 text-sm leading-6">{data.intro}</p>
        <p {...editableRegion("priceNote", "multiline")} className="mt-3 text-sm font-bold">{data.priceNote}</p>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
