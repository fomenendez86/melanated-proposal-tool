import QRCode from "qrcode";

import BrandIcon from "@/components/blocks/shared/BrandIcon";
import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { ImportantItemsData } from "@/lib/types";

interface ImportantItemsBlockProps {
  data: ImportantItemsData;
}

export default async function ImportantItemsBlock({ data }: ImportantItemsBlockProps) {
  const qrCodes = await Promise.all(
    data.rows.map((row) =>
      row.qrCodeUrl
        ? QRCode.toDataURL(row.qrCodeUrl, { margin: 0, width: 128 })
        : null
    )
  );

  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader />
      <div className="mt-8">
        <SectionHeader title="Important Items" />
      </div>

      <div className="mt-10 flex items-center gap-3">
        <BrandIcon slot="warning" className="inline-block size-8" />
        <h1 className="text-2xl font-bold uppercase tracking-tight">Important Items</h1>
      </div>

      <div {...editableRegion("importantItemsSnapshotText", "multiline")} className="mt-8 flex flex-col">
        {data.rows.map((row, index) => (
          <div key={index} className="flex items-center gap-4 border-t border-[var(--design-secondary,#68727d)]/20 py-4 first:border-t-0">
            <div
              className="flex size-14 shrink-0 items-center justify-center border border-[var(--design-secondary,#68727d)]/25 text-2xl"
              style={{ backgroundColor: row.swatchColor }}
            >
              <span>{row.icon}</span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">{row.heading}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {row.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              </div>
              {qrCodes[index] && (
                <img src={qrCodes[index]!} alt="QR code" className="h-16 w-16 shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
