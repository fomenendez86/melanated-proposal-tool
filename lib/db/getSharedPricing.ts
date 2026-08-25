import { eq } from "drizzle-orm";

import { calculatePricing } from "@/lib/pricing/calculate";
import type { ProposalPricingSelection } from "@/lib/pricing/types";
import type { PricingData, ProposalData } from "@/lib/types";

import { db } from "./client";
import { proposalSharePricingSelections } from "./schema";

export function getRevisionPricing(data: ProposalData): PricingData | null {
  return data.sections.find((section): section is Extract<(typeof data.sections)[number], { type: "pricing" }> => section.type === "pricing")?.data ?? null;
}

export async function getSharedPricingState(shareId: number, data: ProposalData) {
  const pricing = getRevisionPricing(data);
  if (!pricing?.lineItems?.length || !pricing.totals) return null;
  const rows = await db.select().from(proposalSharePricingSelections).where(eq(proposalSharePricingSelections.shareId, shareId));
  const selections: ProposalPricingSelection[] = rows.map((row) => ({ key: row.itemPublicId, selected: row.selected, quantityMilli: row.quantityMilli }));
  return calculatePricing(pricing.lineItems.map((item) => ({
    key: item.key, description: item.description, quantityMilli: item.quantityMilli,
    unitPriceMinor: item.unitPriceMinor, unit: item.unit, taxRateBps: item.taxRateBps,
    discountType: item.discountType, discountValue: item.discountValue, optional: item.optional,
    selected: item.selected, quantityEditable: item.quantityEditable,
  })), pricing.totals.currency, selections);
}
