import { cookies } from "next/headers";

import { db } from "@/lib/db/client";
import { getSharedProposal, recordShareEvent, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalSections } from "@/lib/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (record.settings.expiresAt && new Date(record.settings.expiresAt).getTime() < Date.now()) {
    return Response.json({ error: "This proposal has expired." }, { status: 410 });
  }
  if (record.settings.accessKey) {
    const cookieStore = await cookies();
    if (cookieStore.get(shareCookieName(token))?.value !== record.settings.accessKey) {
      return Response.json({ error: "Unlock this proposal before approving." }, { status: 401 });
    }
  }
  const body = await request.json().catch(() => null) as { name?: string; email?: string } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  if (!name || name.length > 120 || (email && !/^\S+@\S+\.\S+$/.test(email))) {
    return Response.json({ error: "Enter your name and a valid email address." }, { status: 400 });
  }
  await db.insert(proposalSections).values({
    proposalId: record.revision.proposalId,
    sectionType: "proposalApproval",
    sortOrder: -7,
    payload: {
      token,
      revisionSectionId: record.settings.revisionSectionId,
      name,
      email: email || null,
      approvedAt: new Date().toISOString(),
    },
  });
  await recordShareEvent(record.revision.proposalId, token, "approved");
  return Response.json({ ok: true });
}
