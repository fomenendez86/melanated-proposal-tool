import type { CoverData } from "@/lib/types";

interface CoverBlockProps {
  data: CoverData;
}

const TORN_EDGE_CLIP_PATH =
  "polygon(9% 0%, 100% 0%, 100% 100%, 5% 100%, 11% 93%, 3% 86%, 13% 79%, 4% 71%, 15% 63%, 3% 55%, 12% 47%, 2% 39%, 14% 31%, 5% 23%, 10% 15%, 3% 7%)";

export default function CoverBlock({ data }: CoverBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] overflow-hidden bg-white text-black">
      <div className="absolute inset-y-0 right-0 w-[68%]">
        <img
          src={data.imageUrl}
          alt={data.title}
          className="h-full w-full object-cover"
          style={{ clipPath: TORN_EDGE_CLIP_PATH }}
        />
      </div>

      <div className="absolute left-0 top-0 h-full w-[32%] px-10 py-10">
        <p className="text-[10px] font-semibold uppercase tracking-wide">
          Melanated Safaris
        </p>

        <div className="mt-4 flex h-[640px] items-center justify-center">
          <span className="whitespace-nowrap font-serif text-[110px] leading-none [writing-mode:vertical-rl]">
            {data.title}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[12px] font-bold uppercase leading-4 tracking-[0.08em]">
            {data.subtitle}
          </p>
          <p className="mt-3 font-serif text-2xl italic">{data.clientLine}</p>
        </div>
      </div>
    </div>
  );
}
