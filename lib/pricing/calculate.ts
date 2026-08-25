import type { PricingLineItemData, PricingTotalsData } from "@/lib/types";

import type { PricingCalculationInput, ProposalPricingSelection } from "./types";

function roundRatio(value: number, divisor: number) {
  return Math.round(value / divisor);
}

export function calculatePricing(
  items: PricingCalculationInput[],
  currency: string,
  selections: ProposalPricingSelection[] = []
): { items: PricingLineItemData[]; totals: PricingTotalsData } {
  const selectionByKey = new Map(selections.map((selection) => [selection.key, selection]));
  const calculated = items.map((item) => {
    const override = selectionByKey.get(item.key);
    const selected = item.optional ? (override?.selected ?? item.selected) : true;
    const quantityMilli = item.quantityEditable ? (override?.quantityMilli ?? item.quantityMilli) : item.quantityMilli;
    const normalizedQuantity = Number.isInteger(quantityMilli) && quantityMilli >= 1 ? quantityMilli : item.quantityMilli;
    const subtotalMinor = selected ? roundRatio(item.unitPriceMinor * normalizedQuantity, 1000) : 0;
    const rawDiscount = item.discountType === "percent"
      ? roundRatio(subtotalMinor * item.discountValue, 10000)
      : item.discountType === "amount" ? item.discountValue : 0;
    const discountMinor = Math.min(subtotalMinor, Math.max(0, rawDiscount));
    const taxMinor = roundRatio((subtotalMinor - discountMinor) * item.taxRateBps, 10000);
    return {
      ...item,
      quantityMilli: normalizedQuantity,
      selected,
      subtotalMinor,
      discountMinor,
      taxMinor,
      totalMinor: subtotalMinor - discountMinor + taxMinor,
    } satisfies PricingLineItemData;
  });
  return {
    items: calculated,
    totals: calculated.reduce<PricingTotalsData>((totals, item) => ({
      ...totals,
      subtotalMinor: totals.subtotalMinor + item.subtotalMinor,
      discountMinor: totals.discountMinor + item.discountMinor,
      taxMinor: totals.taxMinor + item.taxMinor,
      totalMinor: totals.totalMinor + item.totalMinor,
    }), { currency, subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 }),
  };
}

export function formatMinorMoney(amountMinor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}
