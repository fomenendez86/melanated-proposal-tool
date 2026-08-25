"use server";

import { isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { proposalNotifications } from "@/lib/db/schema";

export async function markAllNotificationsRead() {
  if (!(await hasValidSession())) return;
  await db.update(proposalNotifications).set({ readAt: new Date() }).where(isNull(proposalNotifications.readAt));
  revalidatePath("/proposals"); revalidatePath("/proposals/notifications");
}
