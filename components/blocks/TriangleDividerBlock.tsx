import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { TriangleDividerData } from "@/lib/types";

interface TriangleDividerBlockProps {
  data: TriangleDividerData;
}

export default function TriangleDividerBlock({
  data,
}: TriangleDividerBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] overflow-hidden bg-white text-black">
      <div className="px-[82px] pt-12">
        <PageHeader variant="proposalOnly" />
        <div className="mt-2">
          <SectionHeader title={data.sectionLabel} />
        </div>
        <div className="mt-10">
          {data.titleLines.map((line, index) =>
            line.style === "script" ? (
              <p key={index} className="font-serif text-5xl italic leading-tight">
                {line.text}
              </p>
            ) : (
              <p
                key={index}
                className="text-6xl font-bold uppercase leading-tight"
              >
                {line.text}
              </p>
            )
          )}
        </div>
      </div>

      <img
        src={data.imageUrl}
        alt={data.sectionLabel}
        className="mt-10 h-[420px] w-full object-cover"
      />

      <div className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rotate-45 bg-[#1c202b]" />

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
