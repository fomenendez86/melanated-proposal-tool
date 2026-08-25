import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { getSharedPricingState, getRevisionPricing } from "@/lib/db/getSharedPricing";
import { getSharedProposal, isSharedProposalExpired, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalEvents, proposalRevisions, proposalSharePricingSelections, proposalSignatures, proposals } from "@/lib/db/schema";
import { revisionPayloadHash, truncateIpAddress } from "@/lib/signatures/hash";
import { createProposalNotification } from "@/lib/notifications/service";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) return Response.json({ error: "This proposal has expired." }, { status: 410 });
  if (record.share.accessKey) { const cookieStore = await cookies(); if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return Response.json({ error: "Unlock this proposal before signing." }, { status: 401 }); }
  const signatureSection = record.revision.data.sections.find((section) => section.type === "signature");
  if (!signatureSection || signatureSection.type !== "signature") return Response.json({ error: "This proposal does not request a signature." }, { status: 409 });
  const body = await request.json().catch(() => null) as { name?: string; email?: string; role?: string; type?: "typed" | "drawn"; signatureData?: string } | null;
  const name = body?.name?.trim() ?? ""; const email = body?.email?.trim().toLowerCase() ?? ""; const role = body?.role?.trim() ?? ""; const type = body?.type;
  if (!name || name.length > 120 || (email && !/^\S+@\S+\.\S+$/.test(email)) || !signatureSection.data.signers.some((signer) => signer.role === role) || !["typed", "drawn"].includes(type ?? "")) return Response.json({ error: "Enter valid signer details." }, { status: 400 });
  const signatureData = type === "typed" ? name : body?.signatureData ?? "";
  if (type === "drawn" && (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureData) || signatureData.length > 1_400_000)) return Response.json({ error: "Draw a valid signature under 1 MB." }, { status: 400 });
  const [existing] = await db.select({ id: proposalSignatures.id }).from(proposalSignatures).where(and(eq(proposalSignatures.shareId, record.share.id), eq(proposalSignatures.signerRole, role))).limit(1);
  if (existing) return Response.json({ error: "This signer role has already signed." }, { status: 409 });
  const signedAt = new Date(); const payloadHash = revisionPayloadHash(record.revision); const pricing = await getSharedPricingState(record.share.id, record.revision.data);
  db.transaction((tx) => {
    tx.insert(proposalSignatures).values({ proposalId: record.share.proposalId, shareId: record.share.id, revisionId: record.revision.id, signerName: name, signerEmail: email || null, signerRole: role, signatureType: type!, signatureData, ipAddressTruncated: truncateIpAddress(request.headers.get("x-forwarded-for")), userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null, payloadHash, signedAt }).run();
    tx.update(proposalRevisions).set({ sealedAt: signedAt }).where(eq(proposalRevisions.id, record.revision.id)).run();
    if (pricing) for (const item of pricing.items) tx.insert(proposalSharePricingSelections).values({ shareId: record.share.id, itemPublicId: item.key, selected: item.selected, quantityMilli: item.quantityMilli, frozenAt: signedAt }).onConflictDoUpdate({ target: [proposalSharePricingSelections.shareId, proposalSharePricingSelections.itemPublicId], set: { selected: item.selected, quantityMilli: item.quantityMilli, frozenAt: signedAt, updatedAt: signedAt } }).run();
    tx.insert(proposalEvents).values({ proposalId: record.share.proposalId, shareId: record.share.id, type: "signed", metadata: { name, email: email || null, role, signatureType: type, payloadHash, pricing: pricing ? { totals: pricing.totals, selections: pricing.items.map((item) => ({ key: item.key, selected: item.selected, quantityMilli: item.quantityMilli })) } : null }, createdAt: signedAt }).run();
    const revisionPricing = getRevisionPricing(record.revision.data);
    tx.update(proposals).set({ status: "approved", pipelineStage: "won", closedValueMinor: pricing?.totals.totalMinor ?? revisionPricing?.totals?.totalMinor ?? null, closedCurrency: pricing?.totals.currency ?? revisionPricing?.totals?.currency ?? null, updatedAt: signedAt }).where(eq(proposals.id, record.share.proposalId)).run();
  });
  await createProposalNotification({ proposalId: record.share.proposalId, shareId: record.share.id, type: "signature", title: "Proposal signed", body: `${name} signed as ${role}. Revision hash: ${payloadHash}.`, dedupeKey: `signature:${record.share.id}:${role}` });
  return Response.json({ ok: true, payloadHash, signedAt: signedAt.toISOString(), pdfPath: `/api/share/${token}/pdf` });
}
