import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { DetailsData } from "@/lib/types";

interface DetailsBlockProps {
  data: DetailsData;
}

export default function DetailsBlock({ data }: DetailsBlockProps) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader variant="proposalOnly" />

      <div className="mt-2">
        <SectionHeader title="The Details" />
      </div>

      <div className="mt-8 flex flex-col">
        {data.rows.map((row, index) => (
          <div key={index} {...(row.editField ? editableRegion(row.editField) : {})}>
            <div className="bg-black px-4 py-2 text-sm font-bold uppercase text-white">
              {row.label}
            </div>
            <div className="bg-neutral-100 px-4 py-3">
              <ul className="list-disc pl-4">
                <li
                  className={`text-sm ${
                    row.emphasis ? "font-bold text-[#ff0000]" : ""
                  }`}
                >
                  {row.value}
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
