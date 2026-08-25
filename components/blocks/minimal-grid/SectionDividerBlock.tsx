import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { SectionDividerData } from "@/lib/types";

interface SectionDividerBlockProps {
  data: SectionDividerData;
}

/**
 * "full-bleed" variant: a full-bleed image with a structured, darkened
 * label bar instead of Safari Editorial's stacked geometric color blocks.
 */
export default function SectionDividerBlock({ data }: SectionDividerBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] overflow-hidden bg-[#f7f5f0] text-[var(--design-primary,#20252b)]">
      <div className="absolute inset-0">
        <img
          {...editableRegion("sectionImageUrl", "image")}
          src={data.imageUrl || undefined}
          alt={data.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[var(--design-primary,#20252b)]/45" />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[82px] pt-12 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
        <BrandWordmark />
        <span>Proposal</span>
      </div>

      <div className="absolute inset-x-[82px] bottom-24">
        <span className="block h-px w-16 bg-white/70" />
        <h1 {...editableRegion("dividerTitle")} className="mt-4 text-[64px] font-bold uppercase leading-[0.95] text-white">
          {data.title}
        </h1>
        {data.subtitle && (
          <p {...editableRegion("dividerSubtitle")} className="mt-3 text-sm font-semibold uppercase tracking-[0.1em] text-white/85">{data.subtitle}</p>
        )}
      </div>

      <div className="absolute inset-x-[82px] bottom-10 border-t border-white/30 pt-3 text-right text-[10px] font-semibold tracking-[0.2em] text-white">
        {data.pageNumber.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
