"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { createProposalShare } from "@/app/proposals/[id]/editor/shareActions";
import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getProposalDataSnapshot } from "@/lib/db/getProposalData";
import { proposalEmails, proposalEvents, proposalShares } from "@/lib/db/schema";
import { deliverEmail } from "@/lib/email/send";
import { resolveTemplateText } from "@/lib/variables/catalog";

export interface SendProposalResult { ok: boolean; path?: string; delivery?: "sent" | "file" | "link_only"; formError?: string }

export async function sendProposalEmail(proposalId: number, input: { recipients: string; subject: string; message: string; kind?: "send" | "reminder"; expiresInDays?: number }): Promise<SendProposalResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  const recipients = input.recipients.split(/[;,\n]/).map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!recipients.length || recipients.length > 20 || recipients.some((email) => !/^\S+@\S+\.\S+$/.test(email))) return { ok: false, formError: "Enter one or more valid recipient emails." };
  if (!input.subject.trim() || input.subject.length > 200 || !input.message.trim() || input.message.length > 10_000) return { ok: false, formError: "Add a subject and message within the allowed length." };
  const share = await createProposalShare(proposalId, { expiresInDays: input.expiresInDays ?? 30 });
  if (!share.ok || !share.path) return { ok: false, formError: share.formError ?? "The share link could not be created." };
  const token = share.path.split("/").at(-1)!;
  const [shareRow] = await db.select().from(proposalShares).where(eq(proposalShares.token, token)).limit(1);
  const snapshot = await getProposalDataSnapshot(proposalId);
  const subject = resolveTemplateText(input.subject, snapshot.variables);
  const baseUrl = (process.env.PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const message = `${resolveTemplateText(input.message, snapshot.variables)}\n\n${baseUrl}${share.path}`;
  const kind = input.kind === "reminder" ? "reminder" : "send";
  try {
    const delivery = await deliverEmail({ to: recipients, subject, text: message });
    await db.insert(proposalEmails).values({ proposalId, shareId: shareRow?.id ?? null, kind, recipients, subject, provider: delivery.provider, providerMessageId: delivery.messageId ?? null, status: delivery.status });
    await db.insert(proposalEvents).values({ proposalId, shareId: shareRow?.id ?? null, type: kind === "reminder" ? "reminder" : "sent", metadata: { recipients, subject, provider: delivery.provider, delivery: delivery.status } });
    revalidatePath(`/proposals/${proposalId}/editor`); revalidatePath("/proposals");
    return { ok: true, path: share.path, delivery: delivery.status };
  } catch (error) {
    const messageText = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed.";
    await db.insert(proposalEmails).values({ proposalId, shareId: shareRow?.id ?? null, kind, recipients, subject, provider: process.env.EMAIL_PROVIDER ?? "unknown", status: "failed", error: messageText });
    return { ok: false, path: share.path, formError: `The link was created, but email delivery failed: ${messageText}` };
  }
}
