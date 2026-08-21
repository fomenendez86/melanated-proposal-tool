import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import type { TwoColumnListData } from "@/lib/types";

interface TwoColumnListBlockProps {
  data: TwoColumnListData;
}

function ListColumn({
  sections,
  align,
}: {
  sections: TwoColumnListData["leftColumn"];
  align: "left" | "right";
}) {
  return (
    <div className={`flex-1 space-y-6 ${align === "right" ? "text-center" : ""}`}>
      {sections.map((section, index) => (
        <div key={index}>
          <p className="text-sm font-bold uppercase">{section.heading}</p>
          {section.lines.map((line, lineIndex) => (
            <p key={lineIndex} className="text-sm uppercase text-neutral-700">
              {line}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TwoColumnListBlock({ data }: TwoColumnListBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader />

      <div className="mt-8">
        <SectionHeader title={data.title} />
      </div>

      <h1 className="mt-8 text-center font-serif text-5xl italic">
        {data.title}
      </h1>

      <div className="mt-10 flex gap-16">
        <ListColumn sections={data.leftColumn} align="left" />
        <ListColumn sections={data.rightColumn} align="right" />
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
