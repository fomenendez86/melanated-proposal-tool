"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { libraryFees, proposalPricing, proposalPricingItems, proposals } from "@/lib/db/schema";
import { calculatePricing } from "@/lib/pricing/calculate";
import type { PricingDiscountType, PricingUnit } from "@/lib/pricing/types";

export interface PricingMutationResult { ok: boolean; formError?: string }

function parseDecimal(value: string, scale: number, maximum: number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > maximum) return null;
  return Math.round(number * scale);
}

async function validateProposal(proposalId: number) {
  if (!Number.isInteger(proposalId) || proposalId < 1) return false;
  const [proposal] = await db.select({ id: proposals.id }).from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  return Boolean(proposal);
}

async function syncPricingSummary(proposalId: number) {
  const [pricing] = await db.select().from(proposalPricing).where(eq(proposalPricing.proposalId, proposalId)).limit(1);
  if (!pricing) return;
  const items = await db.select().from(proposalPricingItems).where(eq(proposalPricingItems.proposalId, proposalId));
  const calculated = calculatePricing(items.map((item) => ({
    key: item.publicId,
    description: item.description,
    quantityMilli: item.quantityMilli,
    unitPriceMinor: item.unitPriceMinor,
    unit: item.unit,
    taxRateBps: item.taxRateBps,
    discountType: item.discountType,
    discountValue: item.discountValue,
    optional: item.optional,
    selected: item.selectedByDefault,
    quantityEditable: item.quantityEditable,
  })), pricing.currency);
  await db.update(proposalPricing).set({
    invoiceTotal: calculated.totals.subtotalMinor / 100,
    commission: calculated.totals.discountMinor / 100,
    amountDue: calculated.totals.totalMinor / 100,
  }).where(eq(proposalPricing.proposalId, proposalId));
}

function refresh(proposalId: number) {
  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  revalidatePath("/proposals");
}

export async function addProposalPricingItem(
  proposalId: number,
  libraryFeeId?: number
): Promise<PricingMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validateProposal(proposalId))) return { ok: false, formError: "Proposal not found." };
  const [pricing] = await db.select().from(proposalPricing).where(eq(proposalPricing.proposalId, proposalId)).limit(1);
  if (!pricing) return { ok: false, formError: "Add a pricing section before adding line items." };
  const [position] = await db.select({ value: max(proposalPricingItems.sortOrder) }).from(proposalPricingItems).where(eq(proposalPricingItems.proposalId, proposalId));
  const [fee] = Number.isInteger(libraryFeeId)
    ? await db.select().from(libraryFees).where(and(eq(libraryFees.id, libraryFeeId!), eq(libraryFees.currency, pricing.currency))).limit(1)
    : [];
  if (libraryFeeId && !fee) return { ok: false, formError: `Choose a ${pricing.currency} fee from the library.` };
  await db.insert(proposalPricingItems).values({
    publicId: randomUUID(),
    proposalId,
    description: fee?.description?.trim() || fee?.name || "New price item",
    unitPriceMinor: fee?.unitPriceMinor ?? 0,
    currency: pricing.currency,
    unit: fee?.unit ?? "flat",
    taxRateBps: fee?.taxRateBps ?? 0,
    sortOrder: (position?.value ?? -1) + 1,
  });
  await syncPricingSummary(proposalId);
  refresh(proposalId);
  return { ok: true };
}

export async function updateProposalPricingItem(
  proposalId: number,
  itemId: number,
  input: {
    description: string; quantity: string; unitPrice: string; unit: PricingUnit;
    taxRate: string; discountType: PricingDiscountType; discountValue: string;
    optional: boolean; selectedByDefault: boolean; quantityEditable: boolean;
  }
): Promise<PricingMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validateProposal(proposalId)) || !Number.isInteger(itemId)) return { ok: false, formError: "Invalid pricing item." };
  const description = input.description.trim();
  const quantityMilli = parseDecimal(input.quantity, 1000, 1_000_000);
  const unitPriceMinor = parseDecimal(input.unitPrice, 100, 100_000_000);
  const taxRateBps = parseDecimal(input.taxRate, 100, 100);
  const discountValue = input.discountType === "percent"
    ? parseDecimal(input.discountValue, 100, 100)
    : input.discountType === "amount" ? parseDecimal(input.discountValue, 100, 100_000_000) : 0;
  if (!description || description.length > 240 || quantityMilli == null || quantityMilli < 1 || unitPriceMinor == null || taxRateBps == null || discountValue == null) {
    return { ok: false, formError: "Check description, quantity, price, tax, and discount values." };
  }
  const units: PricingUnit[] = ["flat", "per_person", "per_night", "per_vehicle"];
  const discounts: PricingDiscountType[] = ["none", "amount", "percent"];
  if (!units.includes(input.unit) || !discounts.includes(input.discountType)) return { ok: false, formError: "Invalid pricing unit or discount." };
  const result = await db.update(proposalPricingItems).set({
    description, quantityMilli, unitPriceMinor, unit: input.unit, taxRateBps,
    discountType: input.discountType, discountValue,
    optional: input.optional, selectedByDefault: input.optional ? input.selectedByDefault : true,
    quantityEditable: input.optional && input.quantityEditable, updatedAt: new Date(),
  }).where(and(eq(proposalPricingItems.id, itemId), eq(proposalPricingItems.proposalId, proposalId))).returning({ id: proposalPricingItems.id });
  if (!result.length) return { ok: false, formError: "Pricing item not found." };
  await syncPricingSummary(proposalId);
  refresh(proposalId);
  return { ok: true };
}

export async function removeProposalPricingItem(proposalId: number, itemId: number): Promise<PricingMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validateProposal(proposalId)) || !Number.isInteger(itemId)) return { ok: false, formError: "Invalid pricing item." };
  await db.delete(proposalPricingItems).where(and(eq(proposalPricingItems.id, itemId), eq(proposalPricingItems.proposalId, proposalId)));
  await syncPricingSummary(proposalId);
  refresh(proposalId);
  return { ok: true };
}

export async function moveProposalPricingItem(proposalId: number, itemId: number, direction: -1 | 1): Promise<PricingMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!(await validateProposal(proposalId)) || !Number.isInteger(itemId) || ![-1, 1].includes(direction)) return { ok: false, formError: "Invalid pricing reorder." };
  const rows = await db.select({ id: proposalPricingItems.id, sortOrder: proposalPricingItems.sortOrder }).from(proposalPricingItems).where(eq(proposalPricingItems.proposalId, proposalId)).orderBy(asc(proposalPricingItems.sortOrder));
  const index = rows.findIndex((row) => row.id === itemId);
  const other = rows[index + direction];
  if (index < 0 || !other) return { ok: true };
  db.transaction((tx) => {
    tx.update(proposalPricingItems).set({ sortOrder: other.sortOrder }).where(eq(proposalPricingItems.id, itemId)).run();
    tx.update(proposalPricingItems).set({ sortOrder: rows[index].sortOrder }).where(eq(proposalPricingItems.id, other.id)).run();
  });
  refresh(proposalId);
  return { ok: true };
}
