"use server";

import { revalidatePath } from "next/cache";

import { syncExcursionsFromActivityProvider } from "@/lib/activity-provider/sync";
import type { ActivityProviderSyncResult } from "@/lib/activity-provider/types";
import { hasValidSession } from "@/lib/auth/session";

export async function syncExcursionCatalog(proposalId: number): Promise<ActivityProviderSyncResult> {
  if (!(await hasValidSession())) {
    return { ok: false, created: 0, updated: 0, matched: 0, deactivated: 0, failed: 0, total: 0, formError: "Your session expired. Sign in again." };
  }
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return { ok: false, created: 0, updated: 0, matched: 0, deactivated: 0, failed: 0, total: 0, formError: "Invalid proposal." };
  }

  try {
    const result = await syncExcursionsFromActivityProvider();
    revalidatePath(`/proposals/${proposalId}/editor`);
    revalidatePath(`/proposals/${proposalId}/preview`);
    return result;
  } catch (error) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      matched: 0,
      deactivated: 0,
      failed: 0,
      total: 0,
      formError: error instanceof Error ? error.message : "The activity catalog could not be synchronized.",
    };
  }
}
