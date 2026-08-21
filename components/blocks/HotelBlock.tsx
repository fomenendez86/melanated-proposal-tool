import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { HotelData } from "@/lib/types";

interface HotelBlockProps {
  data: HotelData;
}

export default function HotelBlock({ data }: HotelBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <SectionHeader title="Accommodations" />

      <div className="mt-2 flex items-center justify-between text-[10px] font-sans uppercase tracking-wide">
        <div>08</div>
        <div className="text-right">Proposal</div>
      </div>

      <div className="mt-8 flex gap-6">
        <div className="w-[45%] shrink-0">
          <img
            src={data.images.bottomLeft}
            alt={`${data.name} exterior`}
            className="h-[350px] w-full object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col">
          <img
            src={data.images.topRight}
            alt={`${data.name} room`}
            className="aspect-square w-full object-cover"
          />
          <h3 className="mt-4 text-xl font-bold uppercase">{data.name}</h3>
          <p className="mt-2 text-sm">
            <span className="font-bold">Room Category: </span>
            {data.roomCategory}
          </p>
          <p className="text-sm">
            <span className="font-bold">Meal Plan: </span>
            {data.mealPlan}
          </p>
          <p className="mt-2 text-justify text-sm text-neutral-700">
            {data.description}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 text-center text-xs text-neutral-600">
        08
      </div>
    </div>
  );
}
