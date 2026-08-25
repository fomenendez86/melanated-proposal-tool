import { asc, desc, eq, inArray } from "drizzle-orm";

import type { ProposalActivityData } from "@/lib/activity/types";

import { db } from "./client";
import { proposalComments, proposalCommentThreads, proposalEvents, proposalInternalNotes, proposalNotificationSettings } from "./schema";

function eventDetail(type: string, metadata: unknown) {
  const data = (metadata ?? {}) as Record<string, unknown>;
  if (type === "engagement") return `${Array.isArray(data.pages) ? data.pages.length : 0} page-time sample(s)`;
  if (type === "pricing_selected") return "Client updated optional pricing";
  if (type === "signed") return `${String(data.name ?? "Client")} signed as ${String(data.role ?? "signer")}`;
  if (type === "comment_added") return `Comment on ${String(data.sectionKey ?? "section")}`;
  if (type === "sent" || type === "reminder") return `${type === "sent" ? "Sent" : "Reminder"} to ${Array.isArray(data.recipients) ? data.recipients.join(", ") : "client"}`;
  return type.replaceAll("_", " ");
}

export async function getProposalActivity(proposalId: number): Promise<ProposalActivityData> {
  const [events, settingsRows, threads, notes] = await Promise.all([
    db.select().from(proposalEvents).where(eq(proposalEvents.proposalId, proposalId)).orderBy(desc(proposalEvents.createdAt)).limit(500),
    db.select().from(proposalNotificationSettings).where(eq(proposalNotificationSettings.proposalId, proposalId)).limit(1),
    db.select().from(proposalCommentThreads).where(eq(proposalCommentThreads.proposalId, proposalId)).orderBy(desc(proposalCommentThreads.updatedAt)),
    db.select().from(proposalInternalNotes).where(eq(proposalInternalNotes.proposalId, proposalId)).orderBy(desc(proposalInternalNotes.updatedAt)),
  ]);
  const threadIds = threads.map((thread) => thread.id);
  const comments = threadIds.length ? await db.select().from(proposalComments).where(inArray(proposalComments.threadId, threadIds)).orderBy(asc(proposalComments.createdAt)) : [];
  const durationBySection = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "engagement") continue;
    const pages = ((event.metadata as { pages?: Array<{ section?: string; durationMs?: number }> } | null)?.pages ?? []);
    for (const page of pages) if (page.section && Number.isFinite(page.durationMs)) durationBySection.set(page.section, (durationBySection.get(page.section) ?? 0) + Math.max(0, page.durationMs!));
  }
  const pageDurations = [...durationBySection].map(([section, durationMs]) => ({ section, durationMs })).sort((left, right) => right.durationMs - left.durationMs);
  const settings = settingsRows[0];
  return {
    summary: { openings: events.filter((event) => event.type === "opened").length, totalDurationMs: pageDurations.reduce((sum, row) => sum + row.durationMs, 0), mostViewed: pageDurations[0]?.section ?? null, leastViewed: pageDurations.at(-1)?.section ?? null },
    pageDurations,
    timeline: events.map((event) => ({ id: event.id, type: event.type, createdAt: event.createdAt.toISOString(), detail: eventDetail(event.type, event.metadata) })),
    notificationSettings: { recipientEmail: settings?.recipientEmail ?? "", firstOpenEnabled: settings?.firstOpenEnabled ?? true, signatureEnabled: settings?.signatureEnabled ?? true, expiryEnabled: settings?.expiryEnabled ?? true },
    threads: threads.map((thread) => ({ id: thread.id, sectionKey: thread.sectionKey, status: thread.status, orphaned: thread.orphaned, clientName: thread.clientName, comments: comments.filter((comment) => comment.threadId === thread.id).map((comment) => ({ id: comment.id, authorType: comment.authorType, authorName: comment.authorName, body: comment.body, createdAt: comment.createdAt.toISOString() })) })),
    notes: notes.map((note) => ({ id: note.id, sectionKey: note.sectionKey, body: note.body, updatedAt: note.updatedAt.toISOString() })),
  };
}
