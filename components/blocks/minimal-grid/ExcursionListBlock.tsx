import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { ExcursionListData } from "@/lib/types";

interface ExcursionListBlockProps {
  data: ExcursionListData;
}

export default function ExcursionListBlock({ data }: ExcursionListBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <div className="flex items-center justify-between border-b border-[var(--design-secondary,#68727d)]/25 pb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--design-secondary,#68727d)]">
        <BrandWordmark />
        <span>Proposal</span>
      </div>

      <div {...editableRegion("excursionSnapshotText", "multiline")} className="mt-8 flex flex-col">
        {data.items.map((item, index) => (
          <div key={index}>
            <div className="grid grid-cols-[1fr_auto_190px] items-start gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--design-secondary,#68727d)]">{item.description}</p>
              </div>
              <div className="flex max-w-[110px] flex-col items-center self-end text-center">
                {item.priceNote && <p className="text-xs text-[var(--design-secondary,#68727d)]">{item.priceNote}</p>}
                <p className="whitespace-nowrap text-lg font-bold">{item.price}</p>
              </div>
              <div className="border border-[var(--design-secondary,#68727d)]/25 p-1">
                <img src={item.imageUrl || undefined} alt={item.title} className="h-[132px] w-[182px] object-cover" />
              </div>
            </div>
            {index < data.items.length - 1 && (
              <div className="my-6 h-px bg-[var(--design-secondary,#68727d)]/25" />
            )}
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
