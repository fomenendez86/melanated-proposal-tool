import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

export interface SectionRun {
  sectionId: number;
  firstPageId: string;
  title: string;
}

/**
 * Collapses rendered pages into one entry per source section (the first
 * page of each run) — pagination-continuation pages don't get their own
 * entry, matching the rule that only a section's first page is the
 * movable/insertable unit.
 */
export function computeSectionRuns(pageMeta: ProposalPageMeta[]): SectionRun[] {
  const runs: SectionRun[] = [];
  let lastSectionId: number | undefined;
  for (const page of pageMeta) {
    if (page.sourceSectionId == null) {
      lastSectionId = undefined;
      continue;
    }
    if (page.sourceSectionId !== lastSectionId) {
      runs.push({ sectionId: page.sourceSectionId, firstPageId: page.id, title: page.title });
      lastSectionId = page.sourceSectionId;
    }
  }
  return runs;
}
