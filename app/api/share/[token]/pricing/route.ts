import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { getSharedPricingState, getRevisionPricing } from "@/lib/db/getSharedPricing";
import { getSharedProposal, isSharedProposalExpired, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalEvents, proposalSharePricingSelections } from "@/lib/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) return Response.json({ error: "This proposal has expired." }, { status: 410 });
  if (record.share.accessKey) {
    const cookieStore = await cookies();
    if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return Response.json({ error: "Unlock this proposal first." }, { status: 401 });
  }
  const pricing = getRevisionPricing(record.revision.data);
  if (!pricing?.lineItems?.length || !pricing.totals) return Response.json({ error: "Interactive pricing is not available." }, { status: 404 });
  const body = await request.json().catch(() => null) as { selections?: Array<{ key?: string; selected?: boolean; quantityMilli?: number }> } | null;
  if (!Array.isArray(body?.selections) || body!.selections!.length > pricing.lineItems.length) return Response.json({ error: "Invalid pricing selection." }, { status: 400 });
  const byKey = new Map(pricing.lineItems.map((item) => [item.key, item]));
  const normalized: Array<{ key: string; selected: boolean; quantityMilli: number }> = [];
  for (const candidate of body!.selections!) {
    const item = candidate.key ? byKey.get(candidate.key) : null;
    if (!item || typeof candidate.selected !== "boolean") return Response.json({ error: "Invalid pricing item." }, { status: 400 });
    const quantityMilli = item.quantityEditable ? candidate.quantityMilli : item.quantityMilli;
    if (!Number.isInteger(quantityMilli) || quantityMilli! < 1 || quantityMilli! > 1_000_000_000) return Response.json({ error: "Invalid item quantity." }, { status: 400 });
    normalized.push({ key: item.key, selected: item.optional ? candidate.selected : true, quantityMilli: quantityMilli! });
  }
  const frozen = await db.select({ id: proposalSharePricingSelections.id }).from(proposalSharePricingSelections).where(eq(proposalSharePricingSelections.shareId, record.share.id));
  const frozenRow = await db.select({ frozenAt: proposalSharePricingSelections.frozenAt }).from(proposalSharePricingSelections).where(eq(proposalSharePricingSelections.shareId, record.share.id)).limit(1);
  if (frozen.length && frozenRow[0]?.frozenAt) return Response.json({ error: "Pricing was frozen when this proposal was approved." }, { status: 409 });
  db.transaction((tx) => {
    for (const selection of normalized) {
      tx.insert(proposalSharePricingSelections).values({ shareId: record.share.id, itemPublicId: selection.key, selected: selection.selected, quantityMilli: selection.quantityMilli })
        .onConflictDoUpdate({ target: [proposalSharePricingSelections.shareId, proposalSharePricingSelections.itemPublicId], set: { selected: selection.selected, quantityMilli: selection.quantityMilli, updatedAt: new Date() } }).run();
    }
    tx.insert(proposalEvents).values({ proposalId: record.share.proposalId, shareId: record.share.id, type: "pricing_selected", metadata: { selections: normalized } }).run();
  });
  const state = await getSharedPricingState(record.share.id, record.revision.data);
  return Response.json({ ok: true, state });
}
