import { cookies } from "next/headers";

import { db } from "@/lib/db/client";
import { getSharedProposal, isSharedProposalExpired, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalEvents } from "@/lib/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const record = await getSharedProposal(token); if (!record) return new Response(null, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) return new Response(null, { status: 410 });
  if (record.share.accessKey) { const cookieStore = await cookies(); if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return new Response(null, { status: 401 }); }
  const body = await request.json().catch(() => null) as { sessionId?: string; pages?: Array<{ pageIndex?: number; section?: string; durationMs?: number }> } | null;
  if (!body?.sessionId || !/^[a-f0-9-]{20,64}$/i.test(body.sessionId) || !Array.isArray(body.pages) || body.pages.length > 100) return new Response(null, { status: 400 });
  const pages = body.pages.filter((item) => Number.isInteger(item.pageIndex) && item.pageIndex! >= 0 && item.pageIndex! < record.revision.data.sections.length && Number.isFinite(item.durationMs) && item.durationMs! > 0 && item.durationMs! <= 300_000).map((item) => ({ pageIndex: item.pageIndex!, section: String(item.section ?? "unknown").slice(0, 80), durationMs: Math.round(item.durationMs!) }));
  if (!pages.length) return new Response(null, { status: 204 });
  await db.insert(proposalEvents).values({ proposalId: record.share.proposalId, shareId: record.share.id, type: "engagement", metadata: { sessionId: body.sessionId, pages } });
  return new Response(null, { status: 204 });
}
