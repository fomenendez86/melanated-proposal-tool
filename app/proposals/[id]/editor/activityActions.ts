"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { proposalComments, proposalCommentThreads, proposalEvents, proposalInternalNotes, proposalNotificationSettings } from "@/lib/db/schema";

function refresh(proposalId: number) { revalidatePath(`/proposals/${proposalId}/editor`); }

export async function updateNotificationSettings(proposalId: number, input: { recipientEmail: string; firstOpenEnabled: boolean; signatureEnabled: boolean; expiryEnabled: boolean }) {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired." };
  const recipientEmail = input.recipientEmail.trim().toLowerCase(); if (recipientEmail && !/^\S+@\S+\.\S+$/.test(recipientEmail)) return { ok: false, formError: "Enter a valid notification email." };
  await db.insert(proposalNotificationSettings).values({ ...input, proposalId, recipientEmail: recipientEmail || null }).onConflictDoUpdate({ target: proposalNotificationSettings.proposalId, set: { recipientEmail: recipientEmail || null, firstOpenEnabled: input.firstOpenEnabled, signatureEnabled: input.signatureEnabled, expiryEnabled: input.expiryEnabled, updatedAt: new Date() } });
  refresh(proposalId); return { ok: true };
}

export async function addInternalNote(proposalId: number, sectionKey: string, body: string) {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired." }; const text = body.trim();
  if (!text || text.length > 5000 || !sectionKey || sectionKey.length > 120) return { ok: false, formError: "Add a note up to 5,000 characters." };
  await db.insert(proposalInternalNotes).values({ proposalId, sectionKey, body: text }); refresh(proposalId); return { ok: true };
}

export async function replyToComment(proposalId: number, threadId: number, authorName: string, body: string) {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired." }; const text = body.trim(); const name = authorName.trim();
  const [thread] = await db.select().from(proposalCommentThreads).where(and(eq(proposalCommentThreads.id, threadId), eq(proposalCommentThreads.proposalId, proposalId))).limit(1);
  if (!thread || !text || text.length > 5000 || !name || name.length > 120) return { ok: false, formError: "Check the reply details." };
  await db.insert(proposalComments).values({ threadId, authorType: "seller", authorName: name, body: text }); await db.update(proposalCommentThreads).set({ updatedAt: new Date() }).where(eq(proposalCommentThreads.id, threadId)); await db.insert(proposalEvents).values({ proposalId, shareId: thread.shareId, type: "comment_replied", metadata: { threadId, sectionKey: thread.sectionKey } }); refresh(proposalId); return { ok: true };
}

export async function setCommentThreadStatus(proposalId: number, threadId: number, status: "open" | "resolved") {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired." }; const [thread] = await db.select().from(proposalCommentThreads).where(and(eq(proposalCommentThreads.id, threadId), eq(proposalCommentThreads.proposalId, proposalId))).limit(1); if (!thread) return { ok: false, formError: "Comment thread not found." };
  await db.update(proposalCommentThreads).set({ status, updatedAt: new Date() }).where(eq(proposalCommentThreads.id, threadId)); await db.insert(proposalEvents).values({ proposalId, shareId: thread.shareId, type: "comment_resolved", metadata: { threadId, status } }); refresh(proposalId); return { ok: true };
}
