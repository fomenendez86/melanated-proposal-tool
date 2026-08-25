import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { KeyValueLine, PricingData } from "@/lib/types";
import { formatMinorMoney } from "@/lib/pricing/calculate";

interface PricingBlockProps {
  data: PricingData;
}

function KeyValueList({
  lines,
  className = "",
}: {
  lines: KeyValueLine[];
  className?: string;
}) {
  return (
    <ul className={`list-disc space-y-1 pl-4 text-sm ${className}`}>
      {lines.map((line, index) => (
        <li key={index} {...(line.editField ? editableRegion(line.editField) : {})}>
          <span className="font-bold">{line.label}: </span>
          {line.value}
        </li>
      ))}
    </ul>
  );
}

export default function PricingBlock({ data }: PricingBlockProps) {
  const lineItems = data.lineItems;
  const totals = data.totals;
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]">
      <PageHeader />

      <div className="mt-8">
        <SectionHeader title="Pricing and Payment Information" />
      </div>

      <h1 className="mt-8 text-center text-3xl font-bold uppercase tracking-widest">
        Pricing and Payment Information
      </h1>

      <p {...editableRegion("pricingIntro", "multiline")} className="mt-8 text-sm leading-relaxed">{data.intro}</p>

      {lineItems?.length && totals ? (
        <div {...editableRegion("pricingItemsText", "collection")} className="mt-6">
          <p className="text-sm font-bold underline">Package Pricing:</p>
          <table className="mt-2 w-full border-collapse text-left text-xs">
            <thead><tr className="border-b-2 border-[var(--design-primary,#1c202b)]"><th className="py-2 pr-2">Item</th><th className="px-2 py-2 text-right">Qty</th><th className="px-2 py-2 text-right">Unit</th><th className="py-2 pl-2 text-right">Total</th></tr></thead>
            <tbody>
              {lineItems.filter((item) => item.selected).map((item) => (
                <tr key={item.key} className="border-b border-[var(--design-primary,#1c202b)]/15">
                  <td className="py-2 pr-2 font-semibold">{item.description}{item.optional ? <span className="ml-1 font-normal text-[var(--design-primary,#1c202b)]/55">(optional)</span> : null}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{(item.quantityMilli / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatMinorMoney(item.unitPriceMinor, totals.currency)}</td>
                  <td className="py-2 pl-2 text-right font-semibold tabular-nums">{formatMinorMoney(item.totalMinor, totals.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="ml-auto mt-3 w-64 space-y-1 text-xs">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMinorMoney(totals.subtotalMinor, totals.currency)}</dd></div>
            {totals.discountMinor ? <div className="flex justify-between"><dt>Discount</dt><dd>−{formatMinorMoney(totals.discountMinor, totals.currency)}</dd></div> : null}
            {totals.taxMinor ? <div className="flex justify-between"><dt>Tax</dt><dd>{formatMinorMoney(totals.taxMinor, totals.currency)}</dd></div> : null}
            <div className="flex justify-between border-t border-[var(--design-primary,#1c202b)] pt-1 text-sm font-bold text-[#ff0000]"><dt>Total</dt><dd>{formatMinorMoney(totals.totalMinor, totals.currency)}</dd></div>
          </dl>
        </div>
      ) : <div className="mt-6">
        <p className="text-sm font-bold underline">Package Pricing:</p>
        <KeyValueList lines={data.packagePricing} className="mt-2 text-[#ff0000]" />
      </div>}

      <div {...editableRegion("paymentScheduleText", "multiline")} className="mt-6">
        <p className="text-sm font-bold underline">Payment Schedule:</p>
        <KeyValueList lines={data.paymentSchedule} className="mt-2 text-[#ff0000]" />
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold">Banking Information:</p>
        <KeyValueList lines={data.bankingInfo} className="mt-2" />
      </div>

      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
