import PageFooter from "@/components/blocks/shared/PageFooter";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { CityToursDividerData } from "@/lib/types";

interface CityToursDividerBlockProps {
  data: CityToursDividerData;
}

export default function CityToursDividerBlock({
  data,
}: CityToursDividerBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white text-black">
      <div className="relative h-[610px] w-full">
        <img
          {...editableRegion("sectionImageUrl", "image")}
          src={data.imageUrl}
          alt={data.city}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 top-8 flex items-center justify-between px-[71px] text-[10px] font-sans uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <div className="h-[5px] w-[77px] bg-yellow-400" />
            <span className="font-semibold">Melanated Safaris</span>
          </div>
          <div className="text-right">Proposal</div>
        </div>

        <div className="absolute inset-x-0 bottom-8 bg-black px-[71px] py-6 text-white">
          <h1 className="text-6xl font-bold uppercase leading-none">
            {data.city}
          </h1>
          <p className="mt-2 font-serif text-4xl italic">
            Tours &amp; Excursions <span className="align-middle text-3xl">🌍</span>
          </p>
        </div>
      </div>

      <div className="mt-8 px-[82px] text-sm">
        <p {...editableRegion("cityIntro", "multiline")}>{data.intro}</p>
        <p {...editableRegion("priceNote", "multiline")} className="mt-4 font-bold">{data.priceNote}</p>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
