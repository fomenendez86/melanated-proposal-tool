import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import PageFooter from "@/components/blocks/shared/PageFooter";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { SectionDividerData } from "@/lib/types";

interface SectionDividerBlockProps {
  data: SectionDividerData;
}

export default function SectionDividerBlock({
  data,
}: SectionDividerBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white text-black">
      <div className="absolute left-[35px] top-[-12px] h-[492px] w-6 bg-green-700" />
      <div className="absolute left-[13px] top-[98px] h-[5px] w-[77px] bg-yellow-400" />
      <div className="absolute left-[98px] top-[101px] -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide">
        <BrandWordmark />
      </div>

      <div className="absolute right-[82px] top-16 text-[10px] uppercase tracking-wide">
        Proposal
      </div>

      <div className="absolute inset-x-0 top-0 px-[82px] pt-[110px] text-center">
        <h1 {...editableRegion("dividerTitle")} className="text-[77px] font-bold uppercase leading-none tracking-wide">
          {data.title}
        </h1>
        {data.subtitle && (
          <p {...editableRegion("dividerSubtitle")} className="mt-4 text-xl font-bold italic">{data.subtitle}</p>
        )}
        <div className="relative isolate mx-auto mt-4 h-[598px] w-[494px]">
          <div className="absolute -bottom-[33px] -right-14 -z-10 h-[439px] w-[104px] bg-red-600" />
          <img
            {...editableRegion("sectionImageUrl", "image")}
            src={data.imageUrl}
            alt={data.title}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
