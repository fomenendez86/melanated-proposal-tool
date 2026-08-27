import BrandWordmark from "@/components/blocks/shared/BrandWordmark";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { CoverData } from "@/lib/types";

interface CoverBlockProps {
  data: CoverData;
}

const TORN_EDGE_CLIP_PATH =
  "polygon(9% 0%, 100% 0%, 100% 100%, 5% 100%, 11% 93%, 3% 86%, 13% 79%, 4% 71%, 15% 63%, 3% 55%, 12% 47%, 2% 39%, 14% 31%, 5% 23%, 10% 15%, 3% 7%)";

export default function CoverBlock({ data }: CoverBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] overflow-hidden bg-white text-[var(--design-primary,#1c202b)]">
      <div className="absolute inset-y-0 right-0 w-[68%]">
        <img
          {...editableRegion("coverImageUrl", "image")}
          src={data.imageUrl || undefined}
          alt={data.title}
          className="h-full w-full object-cover"
          style={{ clipPath: TORN_EDGE_CLIP_PATH }}
        />
      </div>

      <div className="absolute left-0 top-0 h-full w-[32%] px-10 py-10 text-[var(--design-primary,#1c202b)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {/* The cover carries the mark larger than the running header rules do,
              matching reference/pdf-pages/page-01.png. */}
          <BrandWordmark className="h-[62px]" />
        </p>

        <div className="mt-4 flex h-[640px] items-center justify-center">
          <span {...editableRegion("coverTitle")} className="whitespace-nowrap font-serif text-[110px] leading-none [writing-mode:vertical-rl]">
            {data.title}
          </span>
        </div>

        <div className="mt-4">
          <p {...editableRegion("coverSubtitle", "multiline")} className="text-pretty text-[12px] font-bold uppercase leading-4 tracking-[0.1em]">
            {data.subtitle}
          </p>
          <p {...editableRegion("clientName")} className="text-pretty mt-3 font-script text-3xl">{data.clientLine}</p>
        </div>
      </div>
    </div>
  );
}
