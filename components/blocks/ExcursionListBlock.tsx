import type { ExcursionListData } from "@/lib/types";

interface ExcursionListBlockProps {
  data: ExcursionListData;
}

export default function ExcursionListBlock({ data }: ExcursionListBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wide">
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-6 bg-yellow-400" />
          <span className="font-semibold">Melanated Safaris</span>
        </div>
        <div className="text-right">Proposal</div>
      </div>

      <div className="mt-8 flex flex-col">
        {data.items.map((item, index) => (
          <div key={index}>
            <div className="flex gap-6">
              <div className="w-[60%] overflow-hidden">
                <h3 className="text-sm font-bold uppercase">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-700">
                  {item.description}
                  <span className="float-right ml-4 text-lg font-bold text-black">
                    {item.price}
                  </span>
                </p>
              </div>
              <div className="w-[35%]">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-[150px] w-full object-cover"
                />
              </div>
            </div>
            {index < data.items.length - 1 && (
              <div className="my-6 h-[3px] bg-black" />
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-8 text-center text-xs text-neutral-600">
        22
      </div>
    </div>
  );
}
