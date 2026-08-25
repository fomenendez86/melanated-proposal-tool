"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  addProposalPricingItem,
  moveProposalPricingItem,
  removeProposalPricingItem,
  updateProposalPricingItem,
  type PricingMutationResult,
} from "@/app/proposals/[id]/editor/pricingActions";
import type { ContentLibraryData } from "@/lib/library/types";
import { calculatePricing, formatMinorMoney } from "@/lib/pricing/calculate";
import type { PricingDiscountType, PricingUnit, ProposalPricingEditorItem } from "@/lib/pricing/types";

import { EditorButton, EditorNotice, editorFocusRing } from "./EditorUi";

const controlClass = `h-9 w-full rounded-lg border border-editor-border bg-editor-raised px-2 text-xs text-editor-text ${editorFocusRing}`;

export default function PricingItemsEditor({ proposalId, items, fees }: { proposalId: number; items: ProposalPricingEditorItem[]; fees: ContentLibraryData["fees"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [feeId, setFeeId] = useState("");
  const currency = items[0]?.currency ?? fees[0]?.currency ?? "USD";
  const calculated = useMemo(() => calculatePricing(items.map((item) => ({ ...item, selected: item.selectedByDefault })), currency), [currency, items]);

  function run(action: () => Promise<PricingMutationResult>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.formError ?? "The pricing item could not be saved.");
      else router.refresh();
    });
  }

  return (
    <section className="mb-5 space-y-3" aria-labelledby="pricing-items-heading">
      <div>
        <h3 id="pricing-items-heading" className="text-sm font-semibold text-editor-brand">Line items</h3>
        <p className="mt-1 text-xs leading-4 text-editor-text-muted">Totals use integer cents and are recalculated on the server.</p>
      </div>
      {items.map((item, index) => (
        <details key={item.id} className="rounded-xl border border-editor-border-subtle bg-editor-raised" open={items.length <= 2}>
          <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-editor-text">
            {item.description} · {formatMinorMoney(item.unitPriceMinor, item.currency)}
          </summary>
          <form className="grid grid-cols-2 gap-2 border-t border-editor-border-subtle p-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            run(() => updateProposalPricingItem(proposalId, item.id, {
              description: String(form.get("description") ?? ""), quantity: String(form.get("quantity") ?? ""),
              unitPrice: String(form.get("unitPrice") ?? ""), unit: String(form.get("unit")) as PricingUnit,
              taxRate: String(form.get("taxRate") ?? ""), discountType: String(form.get("discountType")) as PricingDiscountType,
              discountValue: String(form.get("discountValue") ?? "0"), optional: form.has("optional"),
              selectedByDefault: form.has("selectedByDefault"), quantityEditable: form.has("quantityEditable"),
            }));
          }}>
            <label className="col-span-2 text-[11px] font-semibold text-editor-text-muted">Description<input name="description" defaultValue={item.description} maxLength={240} required className={`mt-1 ${controlClass}`} /></label>
            <label className="text-[11px] font-semibold text-editor-text-muted">Quantity<input name="quantity" type="number" min="0.001" step="0.001" defaultValue={item.quantityMilli / 1000} required className={`mt-1 ${controlClass}`} /></label>
            <label className="text-[11px] font-semibold text-editor-text-muted">Unit price<input name="unitPrice" type="number" min="0" step="0.01" defaultValue={(item.unitPriceMinor / 100).toFixed(2)} required className={`mt-1 ${controlClass}`} /></label>
            <label className="text-[11px] font-semibold text-editor-text-muted">Unit<select name="unit" defaultValue={item.unit} className={`mt-1 ${controlClass}`}><option value="flat">Flat</option><option value="per_person">Per person</option><option value="per_night">Per night</option><option value="per_vehicle">Per vehicle</option></select></label>
            <label className="text-[11px] font-semibold text-editor-text-muted">Tax %<input name="taxRate" type="number" min="0" max="100" step="0.01" defaultValue={item.taxRateBps / 100} className={`mt-1 ${controlClass}`} /></label>
            <label className="text-[11px] font-semibold text-editor-text-muted">Discount<select name="discountType" defaultValue={item.discountType} className={`mt-1 ${controlClass}`}><option value="none">None</option><option value="amount">Amount</option><option value="percent">Percent</option></select></label>
            <label className="text-[11px] font-semibold text-editor-text-muted">Discount value<input name="discountValue" type="number" min="0" step="0.01" defaultValue={item.discountType === "percent" ? item.discountValue / 100 : item.discountValue / 100} className={`mt-1 ${controlClass}`} /></label>
            <label className="col-span-2 flex items-center gap-2 text-xs text-editor-text"><input name="optional" type="checkbox" defaultChecked={item.optional} /> Optional client choice</label>
            <label className="flex items-center gap-2 text-xs text-editor-text"><input name="selectedByDefault" type="checkbox" defaultChecked={item.selectedByDefault} /> Selected by default</label>
            <label className="flex items-center gap-2 text-xs text-editor-text"><input name="quantityEditable" type="checkbox" defaultChecked={item.quantityEditable} /> Client edits quantity</label>
            <div className="col-span-2 flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-1"><EditorButton type="button" variant="ghost" aria-label={`Move ${item.description} up`} disabled={pending || index === 0} onClick={() => run(() => moveProposalPricingItem(proposalId, item.id, -1))}><ArrowUp className="size-3.5" /></EditorButton><EditorButton type="button" variant="ghost" aria-label={`Move ${item.description} down`} disabled={pending || index === items.length - 1} onClick={() => run(() => moveProposalPricingItem(proposalId, item.id, 1))}><ArrowDown className="size-3.5" /></EditorButton><EditorButton type="button" variant="ghost" aria-label={`Delete ${item.description}`} disabled={pending} onClick={() => { if (window.confirm(`Delete ${item.description}?`)) run(() => removeProposalPricingItem(proposalId, item.id)); }}><Trash2 className="size-3.5" /></EditorButton></div>
              <EditorButton type="submit" variant="primary" disabled={pending}>Save item</EditorButton>
            </div>
          </form>
        </details>
      ))}
      <div className="flex gap-2">
        <select aria-label="Reusable fee" value={feeId} onChange={(event) => setFeeId(event.target.value)} className={controlClass}><option value="">Ad hoc item</option>{fees.filter((fee) => fee.currency === currency).map((fee) => <option key={fee.id} value={fee.id}>{fee.name}</option>)}</select>
        <EditorButton type="button" variant="primary" disabled={pending} onClick={() => run(() => addProposalPricingItem(proposalId, feeId ? Number(feeId) : undefined))}><Plus className="size-3.5" /> Add</EditorButton>
      </div>
      {items.length ? <dl className="rounded-xl border border-editor-border-subtle bg-editor-raised p-3 text-xs text-editor-text"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMinorMoney(calculated.totals.subtotalMinor, currency)}</dd></div><div className="mt-1 flex justify-between"><dt>Discount</dt><dd>−{formatMinorMoney(calculated.totals.discountMinor, currency)}</dd></div><div className="mt-1 flex justify-between"><dt>Tax</dt><dd>{formatMinorMoney(calculated.totals.taxMinor, currency)}</dd></div><div className="mt-2 flex justify-between border-t border-editor-border pt-2 font-bold"><dt>Total</dt><dd>{formatMinorMoney(calculated.totals.totalMinor, currency)}</dd></div></dl> : <EditorNotice tone="warning">Add a line item to enable calculated pricing.</EditorNotice>}
      {error ? <EditorNotice tone="danger">{error}</EditorNotice> : null}
    </section>
  );
}
