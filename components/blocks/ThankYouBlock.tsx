import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import type { ThankYouData } from "@/lib/types";

interface ThankYouBlockProps {
  data: ThankYouData;
}

export default function ThankYouBlock({ data }: ThankYouBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] overflow-hidden bg-white text-black">
      <div className="px-[82px] pt-12">
        <PageHeader variant="proposalOnly" />
      </div>

      <div className="absolute inset-y-0 right-0 h-full w-[45%]">
        <img
          src={data.imageUrl}
          alt="Thank you"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute left-0 top-1/2 w-[55%] -translate-y-1/2 px-[82px]">
        <p className="font-serif text-5xl italic">{data.message}</p>
      </div>

      <div className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rotate-45 bg-black" />

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
