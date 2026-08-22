import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { FromOwnersData } from "@/lib/types";

interface FromOwnersBlockProps {
  data: FromOwnersData;
}

export default function FromOwnersBlock({ data }: FromOwnersBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <div className="flex h-full gap-8">
        <div className="flex w-16 shrink-0 items-center justify-center">
          <span className="rotate-180 whitespace-nowrap text-4xl font-bold uppercase tracking-wide [writing-mode:vertical-rl]">
            From the Owners
          </span>
        </div>
        <div className="w-px shrink-0 bg-neutral-300" />
        <div className="flex-1">
          <PageHeader />

          <div {...editableRegion("ownerParagraphsText", "multiline")} className="mt-10 space-y-4 text-sm">
            {data.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div {...editableRegion("founderSignaturesText", "multiline")} className="mt-8 flex gap-16">
            {data.founders.map((founder, index) => (
              <div key={index}>
                <p className="text-sm font-bold">{founder.name}</p>
                <p className="text-sm">{founder.title}</p>
              </div>
            ))}
          </div>

          <img
            {...editableRegion("ownerPhotoUrl", "image")}
            src={data.photoUrl}
            alt="Melanated Safaris team"
            className="mt-8 h-[280px] w-full object-cover"
          />
        </div>
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
