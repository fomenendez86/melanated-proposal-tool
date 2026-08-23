import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { getSharedProposal, isSharedProposalExpired, recordShareEvent, shareCookieName } from "@/lib/db/getSharedProposal";
import { nextProposalStatus } from "@/lib/db/proposalStatus";
import { proposals } from "@/lib/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) {
    return Response.json({ error: "This proposal has expired." }, { status: 410 });
  }
  if (record.share.accessKey) {
    const cookieStore = await cookies();
    if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) {
      return Response.json({ error: "Unlock this proposal before approving." }, { status: 401 });
    }
  }
  const body = await request.json().catch(() => null) as { name?: string; email?: string } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  if (!name || name.length > 120 || (email && !/^\S+@\S+\.\S+$/.test(email))) {
    return Response.json({ error: "Enter your name and a valid email address." }, { status: 400 });
  }
  await recordShareEvent(record.share.proposalId, record.share.id, "approved", { name, email: email || null });
  const [proposal] = await db.select({ status: proposals.status }).from(proposals).where(eq(proposals.id, record.share.proposalId));
  const nextStatus = proposal ? nextProposalStatus(proposal.status, "approved") : null;
  if (nextStatus) {
    await db.update(proposals).set({ status: nextStatus, updatedAt: new Date() }).where(eq(proposals.id, record.share.proposalId));
  }
  return Response.json({ ok: true });
}
