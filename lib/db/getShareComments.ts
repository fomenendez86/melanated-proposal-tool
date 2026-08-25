import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "./client";
import { proposalComments, proposalCommentThreads } from "./schema";

export interface ShareCommentThread {
  id: number;
  sectionKey: string;
  status: "open" | "resolved";
  orphaned: boolean;
  clientName: string;
  comments: Array<{ id: number; authorType: "client" | "seller"; authorName: string; body: string; createdAt: string }>;
}

export async function getShareCommentThreads(shareId: number): Promise<ShareCommentThread[]> {
  const threads = await db
    .select()
    .from(proposalCommentThreads)
    .where(eq(proposalCommentThreads.shareId, shareId))
    .orderBy(desc(proposalCommentThreads.updatedAt));
  const threadIds = threads.map((thread) => thread.id);
  const comments = threadIds.length
    ? await db.select().from(proposalComments).where(inArray(proposalComments.threadId, threadIds)).orderBy(asc(proposalComments.createdAt))
    : [];
  return threads.map((thread) => ({
    id: thread.id,
    sectionKey: thread.sectionKey,
    status: thread.status,
    orphaned: thread.orphaned,
    clientName: thread.clientName,
    comments: comments
      .filter((comment) => comment.threadId === thread.id)
      .map((comment) => ({ id: comment.id, authorType: comment.authorType, authorName: comment.authorName, body: comment.body, createdAt: comment.createdAt.toISOString() })),
  }));
}
