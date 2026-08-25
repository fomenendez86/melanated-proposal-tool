import { and, eq } from "drizzle-orm";

import type { Transaction } from "./client";
import { proposalCommentThreads } from "./schema";
import type { ProposalSection } from "@/lib/types";

/**
 * Re-derives which open comment threads still point at a section that
 * exists in the newly shared revision. A thread's section can disappear
 * (removed/reordered past recognition) between shares; this keeps
 * `orphaned` accurate instead of leaving stale threads silently pointing
 * at nothing. Runs inside the same sync transaction as share creation.
 */
export function syncCommentThreadsForRevision(transaction: Transaction, proposalId: number, sections: ProposalSection[]) {
  const openThreads = transaction
    .select()
    .from(proposalCommentThreads)
    .where(and(eq(proposalCommentThreads.proposalId, proposalId), eq(proposalCommentThreads.status, "open")))
    .all();
  if (openThreads.length === 0) return;

  const validSectionKeys = new Set(sections.map((section, index) => `${section.type}-${index + 1}`));
  const validSourceSectionIds = new Set(
    sections.map((section) => section.editorSource?.sectionId).filter((sectionId): sectionId is number => sectionId != null)
  );

  for (const thread of openThreads) {
    const stillPresent =
      (thread.sourceSectionId != null && validSourceSectionIds.has(thread.sourceSectionId)) || validSectionKeys.has(thread.sectionKey);
    if (thread.orphaned === !stillPresent) continue;
    transaction.update(proposalCommentThreads).set({ orphaned: !stillPresent, updatedAt: new Date() }).where(eq(proposalCommentThreads.id, thread.id)).run();
  }
}
