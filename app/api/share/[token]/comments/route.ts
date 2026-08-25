import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { getShareCommentThreads } from "@/lib/db/getShareComments";
import { getSharedProposal, isSharedProposalExpired, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalComments, proposalCommentThreads, proposalEvents } from "@/lib/db/schema";
import { buildProposalPageMeta } from "@/lib/editor/proposalPageMeta";
import { createProposalNotification } from "@/lib/notifications/service";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) return Response.json({ error: "This proposal has expired." }, { status: 410 });
  if (record.share.accessKey) {
    const cookieStore = await cookies();
    if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return Response.json({ error: "Unlock this proposal first." }, { status: 401 });
  }
  return Response.json({ ok: true, threads: await getShareCommentThreads(record.share.id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) return Response.json({ error: "This proposal has expired." }, { status: 410 });
  if (record.share.accessKey) {
    const cookieStore = await cookies();
    if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return Response.json({ error: "Unlock this proposal first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { sectionKey?: string; clientName?: string; body?: string } | null;
  const sectionKey = body?.sectionKey?.trim() ?? "";
  const clientName = body?.clientName?.trim() ?? "";
  const commentBody = body?.body?.trim() ?? "";
  const pageMeta = buildProposalPageMeta(record.revision.data.sections);
  const page = pageMeta.find((entry) => entry.id === sectionKey);
  if (!page) return Response.json({ error: "Unknown section." }, { status: 400 });
  if (!clientName || clientName.length > 120) return Response.json({ error: "Enter a name up to 120 characters." }, { status: 400 });
  if (!commentBody || commentBody.length > 5000) return Response.json({ error: "Enter a comment up to 5,000 characters." }, { status: 400 });

  const proposalId = record.share.proposalId;
  const shareId = record.share.id;
  const revisionId = record.revision.id;

  const commentId = db.transaction((tx) => {
    const [existingThread] = tx
      .select()
      .from(proposalCommentThreads)
      .where(and(eq(proposalCommentThreads.shareId, shareId), eq(proposalCommentThreads.sectionKey, sectionKey), eq(proposalCommentThreads.status, "open")))
      .all();
    const threadId = existingThread
      ? existingThread.id
      : tx
          .insert(proposalCommentThreads)
          .values({
            proposalId,
            shareId,
            revisionId,
            sectionKey,
            sourceSectionId: page.sourceSectionId ?? null,
            clientName,
            status: "open",
          })
          .returning({ id: proposalCommentThreads.id })
          .get().id;
    if (existingThread) {
      tx.update(proposalCommentThreads).set({ updatedAt: new Date() }).where(eq(proposalCommentThreads.id, threadId)).run();
    }
    const comment = tx
      .insert(proposalComments)
      .values({ threadId, authorType: "client", authorName: clientName, body: commentBody })
      .returning({ id: proposalComments.id })
      .get();
    tx.insert(proposalEvents).values({ proposalId, shareId, type: "comment_added", metadata: { threadId, sectionKey } }).run();
    return comment.id;
  });

  await createProposalNotification({
    proposalId,
    shareId,
    type: "comment",
    title: "New comment on your proposal",
    body: `${clientName} commented on ${page.title}.`,
    dedupeKey: `comment:${commentId}`,
  });

  return Response.json({ ok: true, threads: await getShareCommentThreads(shareId) });
}
