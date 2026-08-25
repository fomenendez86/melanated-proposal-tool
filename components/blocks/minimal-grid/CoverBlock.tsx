import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { CoverData } from "@/lib/types";

interface CoverBlockProps {
  data: CoverData;
}

export default function CoverBlock({ data }: CoverBlockProps) {
  return (
    <div className="relative box-border flex h-[1056px] w-[816px] flex-col bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <div className="flex items-center justify-between border-b border-[var(--design-secondary,#68727d)]/25 pb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--design-secondary,#68727d)]">
        <BrandWordmark />
        <span>Proposal</span>
      </div>

      <div className="mt-16 flex flex-1 gap-10">
        <div className="flex w-[46%] flex-col justify-between">
          <div>
            <span {...editableRegion("coverTitle")} className="block break-words text-[42px] font-bold uppercase leading-[0.98] tracking-tight">
              {data.title}
            </span>
            <p {...editableRegion("coverSubtitle", "multiline")} className="mt-6 text-sm font-semibold uppercase leading-6 tracking-[0.08em] text-[var(--design-secondary,#68727d)]">
              {data.subtitle}
            </p>
          </div>
          <div>
            <span className="block h-px w-12 bg-[var(--design-accent,#d8c8a8)]" />
            <p {...editableRegion("clientName")} className="mt-3 text-lg font-semibold">{data.clientLine}</p>
          </div>
        </div>

        <div className="flex-1 border border-[var(--design-secondary,#68727d)]/25 p-3">
          <img
            {...editableRegion("coverImageUrl", "image")}
            src={data.imageUrl || undefined}
            alt={data.title}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
