import HotelBlockLayout from "@/components/blocks/shared/layouts/HotelBlockLayout";
import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import type { HotelData } from "@/lib/types";

interface HotelBlockProps {
  data: HotelData;
}

export default function HotelBlock({ data }: HotelBlockProps) {
  return (
    <HotelBlockLayout
      data={data}
      pageClassName="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]"
      header={
        <>
          <PageHeader variant="labelOnly" />
          <div className="mt-6">
            <SectionHeader title="Accommodations" />
          </div>
        </>
      }
      imageWrap={(image) => <div className="border border-[var(--design-secondary,#68727d)]/25 p-2">{image}</div>}
      bottomLeftTopImageClassName="h-[460px] w-full object-cover"
      bottomLeftBottomImageClassName="h-[260px] w-full object-cover"
      topRightImageClassName="aspect-[292/268] w-full object-cover"
      nameClassName="mt-4 text-lg font-bold uppercase tracking-tight"
      roomCategoryClassName="mt-3 text-sm"
      mealPlanClassName="text-sm"
      descriptionClassName="mt-3 text-sm leading-6 text-[var(--design-secondary,#68727d)]"
      PageFooter={PageFooter}
    />
  );
}
