import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import PageFooter from "@/components/blocks/shared/PageFooter";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { ExcursionListData } from "@/lib/types";

interface ExcursionListBlockProps {
  data: ExcursionListData;
}

export default function ExcursionListBlock({ data }: ExcursionListBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]">
      <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wide">
        <div className="flex items-center gap-2">
          <div className="h-[5px] w-[77px] bg-yellow-400" />
          <span className="font-semibold"><BrandWordmark /></span>
        </div>
        <div className="text-right">Proposal</div>
      </div>

      <div {...editableRegion("excursionSnapshotText", "multiline")} className="mt-8 flex flex-col">
        {data.items.map((item, index) => (
          <div key={index}>
            <div className="grid grid-cols-[1fr_auto_190px] items-start gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-700">
                  {item.description}
                </p>
              </div>
              <div className="self-end flex max-w-[110px] flex-col items-center text-center">
                {item.priceNote && (
                  <p className="text-xs text-neutral-700">{item.priceNote}</p>
                )}
                <p className="whitespace-nowrap text-lg font-bold">{item.price}</p>
              </div>
              <div>
                <img
                  src={item.imageUrl || undefined}
                  alt={item.title}
                  className="h-[140px] w-[190px] object-cover"
                />
              </div>
            </div>
            {index < data.items.length - 1 && (
              <div className="my-6 h-[3px] bg-[var(--design-primary,#1c202b)]" />
            )}
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
