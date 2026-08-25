import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { HotelData } from "@/lib/types";

interface HotelBlockProps {
  data: HotelData;
}

export default function HotelBlock({ data }: HotelBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader variant="labelOnly" />
      <div className="mt-6">
        <SectionHeader title="Accommodations" />
      </div>

      <div className="mt-8 flex gap-6">
        <div className="flex w-[45%] shrink-0 flex-col gap-4">
          <div className="border border-[var(--design-secondary,#68727d)]/25 p-2">
            <img
              {...editableRegion("hotelImageBottomLeftTop", "image")}
              src={data.images.bottomLeftTop || undefined}
              alt={`${data.name} detail`}
              className="h-[460px] w-full object-cover"
            />
          </div>
          <div className="border border-[var(--design-secondary,#68727d)]/25 p-2">
            <img
              {...editableRegion("hotelImageBottomLeftBottom", "image")}
              src={data.images.bottomLeftBottom || undefined}
              alt={`${data.name} exterior`}
              className="h-[260px] w-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="border border-[var(--design-secondary,#68727d)]/25 p-2">
            <img
              {...editableRegion("hotelImageTopRight", "image")}
              src={data.images.topRight || undefined}
              alt={`${data.name} room`}
              className="aspect-[292/268] w-full object-cover"
            />
          </div>
          <h3 {...editableRegion("hotelName")} className="mt-4 text-lg font-bold uppercase tracking-tight">{data.name}</h3>
          <p {...editableRegion("roomCategory")} className="mt-3 text-sm"><span className="font-bold">Room Category: </span>{data.roomCategory}</p>
          <p {...editableRegion("mealPlan")} className="text-sm"><span className="font-bold">Meal Plan: </span>{data.mealPlan}</p>
          <p {...editableRegion("hotelDescription", "multiline")} className="mt-3 text-sm leading-6 text-[var(--design-secondary,#68727d)]">{data.description}</p>
        </div>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
