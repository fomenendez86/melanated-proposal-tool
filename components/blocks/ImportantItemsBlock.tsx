import QRCode from "qrcode";

import BrandIcon from "@/components/blocks/shared/BrandIcon";
import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { ImportantItemsData } from "@/lib/types";

interface ImportantItemsBlockProps {
  data: ImportantItemsData;
}

export default async function ImportantItemsBlock({
  data,
}: ImportantItemsBlockProps) {
  const qrCodes = await Promise.all(
    data.rows.map((row) =>
      row.qrCodeUrl
        ? QRCode.toDataURL(row.qrCodeUrl, { margin: 0, width: 128 })
        : null
    )
  );

  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-black">
      <PageHeader />

      <div className="mt-8">
        <SectionHeader title="Important Items" />
      </div>

      <div className="mt-8 text-center">
        <BrandIcon slot="warning" className="text-5xl" />
        <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide">
          Important Items
        </h1>
      </div>

      <div {...editableRegion("importantItemsSnapshotText", "multiline")} className="mt-8 flex flex-col">
        {data.rows.map((row, index) => (
          <div key={index} className="flex">
            <div
              className="flex w-[110px] shrink-0 items-center justify-center py-6"
              style={{ backgroundColor: row.swatchColor }}
            >
              <span className="text-4xl">{row.icon}</span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-4 bg-neutral-100 px-6 py-4">
              <div>
                <p className="text-sm font-bold uppercase">{row.heading}</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                  {row.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              </div>
              {qrCodes[index] && (
                <img
                  src={qrCodes[index]!}
                  alt="QR code"
                  className="h-16 w-16 shrink-0"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
