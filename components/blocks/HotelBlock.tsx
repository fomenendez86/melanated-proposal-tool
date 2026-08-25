import HotelBlockLayout from "@/components/blocks/shared/layouts/HotelBlockLayout";
import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { HotelData } from "@/lib/types";

interface HotelBlockProps {
  data: HotelData;
}

export default function HotelBlock({ data }: HotelBlockProps) {
  return (
    <HotelBlockLayout
      data={data}
      pageClassName="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]"
      header={
        <>
          <SectionHeader title="Accommodations" />
          <div className="mt-2">
            <PageHeader variant="proposalOnly" />
          </div>
        </>
      }
      bottomLeftTopImageClassName="h-[500px] w-full object-cover"
      bottomLeftBottomImageClassName="h-[280px] w-full object-cover"
      topRightImageClassName="aspect-[292/268] w-full object-cover"
      nameClassName="mt-4 text-xl font-bold uppercase"
      roomCategoryClassName="mt-2 text-sm"
      mealPlanClassName="text-sm"
      descriptionClassName="mt-2 text-justify text-sm text-neutral-700"
      PageFooter={PageFooter}
    />
  );
}
