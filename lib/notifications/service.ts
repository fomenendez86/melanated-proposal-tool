import { and, eq, gte, isNull, lte } from "drizzle-orm";

import { deliverEmail } from "@/lib/email/send";

import { db } from "../db/client";
import { proposalEvents, proposalNotificationSettings, proposalNotifications, proposalShares } from "../db/schema";

type NotificationType = "first_open" | "signature" | "expiring" | "comment";

export async function createProposalNotification(input: { proposalId: number; shareId?: number | null; type: NotificationType; title: string; body: string; dedupeKey: string }) {
  const [existing] = await db.select({ id: proposalNotifications.id }).from(proposalNotifications).where(eq(proposalNotifications.dedupeKey, input.dedupeKey)).limit(1);
  if (existing) return;
  const [settings] = await db.select().from(proposalNotificationSettings).where(eq(proposalNotificationSettings.proposalId, input.proposalId)).limit(1);
  const enabled = input.type === "first_open" ? settings?.firstOpenEnabled ?? true : input.type === "signature" ? settings?.signatureEnabled ?? true : input.type === "expiring" ? settings?.expiryEnabled ?? true : true;
  const recipient = settings?.recipientEmail ?? process.env.SELLER_NOTIFICATION_EMAIL ?? "";
  const createdAt = new Date();
  const inserted = await db.insert(proposalNotifications).values({ ...input, shareId: input.shareId ?? null, createdAt }).returning({ id: proposalNotifications.id });
  let emailedAt: Date | null = null;
  if (enabled && recipient) {
    try { const delivered = await deliverEmail({ to: [recipient], subject: input.title, text: input.body }); if (delivered.status !== "link_only") emailedAt = new Date(); } catch { /* in-app delivery remains authoritative */ }
  }
  if (emailedAt) await db.update(proposalNotifications).set({ emailedAt }).where(eq(proposalNotifications.id, inserted[0].id));
  await db.insert(proposalEvents).values({ proposalId: input.proposalId, shareId: input.shareId ?? null, type: "notification_sent", metadata: { notificationType: input.type, emailed: Boolean(emailedAt) } });
}

export async function ensureExpiringShareNotifications() {
  const now = new Date(); const soon = new Date(now.getTime() + 3 * 86_400_000);
  const shares = await db.select({ id: proposalShares.id, proposalId: proposalShares.proposalId, expiresAt: proposalShares.expiresAt }).from(proposalShares).where(and(isNull(proposalShares.revokedAt), gte(proposalShares.expiresAt, now), lte(proposalShares.expiresAt, soon)));
  await Promise.all(shares.map((share) => createProposalNotification({ proposalId: share.proposalId, shareId: share.id, type: "expiring", title: "Proposal link expires soon", body: `Share ${share.id} expires ${share.expiresAt?.toISOString()}.`, dedupeKey: `expiring:${share.id}` })));
}
