import type { ComponentType, ReactNode } from "react";

import { editableRegion } from "@/lib/editor/editableRegions";
import type { HotelData } from "@/lib/types";

// Owns the wrapper geometry, the 2-column image/details grid, and all 6
// editableRegion() calls in the fixed order the field-name contract
// requires — the part of HotelBlock that's identical between Safari
// Editorial and Minimal Grid (confirmed by reading both in full). Each
// design supplies its own header arrangement (PageHeader/SectionHeader
// order and spacing differ) and theme tokens (image framing, text sizes,
// muted-text color) rather than the layout guessing at a shared DOM shape
// for those parts.
export interface HotelBlockLayoutProps {
  data: HotelData;
  pageClassName: string;
  header: ReactNode;
  imageWrap?: (image: ReactNode) => ReactNode;
  bottomLeftTopImageClassName: string;
  bottomLeftBottomImageClassName: string;
  topRightImageClassName: string;
  nameClassName: string;
  roomCategoryClassName: string;
  mealPlanClassName: string;
  descriptionClassName: string;
  PageFooter: ComponentType<{ pageNumber: number }>;
}

export default function HotelBlockLayout({
  data,
  pageClassName,
  header,
  imageWrap = (image) => image,
  bottomLeftTopImageClassName,
  bottomLeftBottomImageClassName,
  topRightImageClassName,
  nameClassName,
  roomCategoryClassName,
  mealPlanClassName,
  descriptionClassName,
  PageFooter,
}: HotelBlockLayoutProps) {
  return (
    <div className={pageClassName}>
      {header}

      <div className="mt-8 flex gap-6">
        <div className="flex w-[45%] shrink-0 flex-col gap-4">
          {imageWrap(
            <img
              {...editableRegion("hotelImageBottomLeftTop", "image")}
              src={data.images.bottomLeftTop || undefined}
              alt={`${data.name} detail`}
              className={bottomLeftTopImageClassName}
            />
          )}
          {imageWrap(
            <img
              {...editableRegion("hotelImageBottomLeftBottom", "image")}
              src={data.images.bottomLeftBottom || undefined}
              alt={`${data.name} exterior`}
              className={bottomLeftBottomImageClassName}
            />
          )}
        </div>
        <div className="flex flex-1 flex-col">
          {imageWrap(
            <img
              {...editableRegion("hotelImageTopRight", "image")}
              src={data.images.topRight || undefined}
              alt={`${data.name} room`}
              className={topRightImageClassName}
            />
          )}
          <h3 {...editableRegion("hotelName")} className={nameClassName}>{data.name}</h3>
          <p {...editableRegion("roomCategory")} className={roomCategoryClassName}>
            <span className="font-bold">Room Category: </span>
            {data.roomCategory}
          </p>
          <p {...editableRegion("mealPlan")} className={mealPlanClassName}>
            <span className="font-bold">Meal Plan: </span>
            {data.mealPlan}
          </p>
          <p {...editableRegion("hotelDescription", "multiline")} className={descriptionClassName}>
            {data.description}
          </p>
        </div>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
