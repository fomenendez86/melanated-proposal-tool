"use client";

import { GripVertical, Layers3, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { moveProposalSection } from "@/app/proposals/[id]/editor/compositionActions";
import type { ProposalCompositionData } from "@/lib/composition/types";
import type { DocumentPageGeometry } from "@/lib/designs/types";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";
import { computeSectionRuns } from "@/lib/editor/sectionRuns";

import { EditorEmptyState, EditorPageCard, EditorPanelHeader } from "./EditorUi";
import { usePointerReorder } from "./usePointerReorder";

function PageThumbnail({ page, pageSize }: { page: ReactNode; pageSize: DocumentPageGeometry }) {
  const thumbnailScale = 48 / pageSize.widthPx;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white" aria-hidden="true">
      <div
        className="origin-top-left"
        style={{
          width: pageSize.widthPx,
          height: pageSize.heightPx,
          transform: `scale(${thumbnailScale})`,
        }}
      >
        {page}
      </div>
    </div>
  );
}

export default function PageNavigator({
  proposalId,
  composition,
  pageMeta,
  pages,
  selectedPage,
  filter,
  onFilterChange,
  onSelect,
  pageSize,
  onClose,
  enableDrag = false,
  announce,
}: {
  proposalId: number;
  composition: ProposalCompositionData;
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
  selectedPage: ProposalPageMeta;
  filter: string;
  onFilterChange: (value: string) => void;
  onSelect: (page: ProposalPageMeta) => void;
  pageSize: DocumentPageGeometry;
  onClose?: () => void;
  enableDrag?: boolean;
  announce?: (message: string) => void;
}) {
  const router = useRouter();
  const [isMoving, setIsMoving] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  const filteredPages = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return pageMeta;
    return pageMeta.filter((page) =>
      `${page.pageNumber} ${page.eyebrow} ${page.title} ${page.description}`
        .toLowerCase()
        .includes(query)
    );
  }, [filter, pageMeta]);

  const runs = useMemo(() => computeSectionRuns(pageMeta), [pageMeta]);
  const runIndexByPageId = useMemo(() => {
    const map = new Map<string, number>();
    runs.forEach((run, index) => map.set(run.firstPageId, index));
    return map;
  }, [runs]);

  const dragActive = enableDrag && filter.trim() === "" && !isMoving && runs.length > 1;

  async function handleReorder(fromIndex: number, toGapIndex: number) {
    const run = runs[fromIndex];
    if (!run) return;
    const sectionId = run.sectionId;
    const raw = composition.items.map((item) => item.id);
    const i = raw.indexOf(sectionId);
    if (i === -1) return;
    const rawWithoutS = raw.filter((id) => id !== sectionId);

    const visibleWithoutS = runs.filter((r) => r.sectionId !== sectionId).map((r) => r.sectionId);
    const adjustedGap = toGapIndex > fromIndex ? toGapIndex - 1 : toGapIndex;
    const insertAt = Math.max(0, Math.min(adjustedGap, visibleWithoutS.length));

    const j =
      insertAt >= visibleWithoutS.length
        ? rawWithoutS.length
        : rawWithoutS.indexOf(visibleWithoutS[insertAt]);

    const steps = j - i;
    if (steps === 0) return;
    const direction = steps > 0 ? 1 : -1;

    setIsMoving(true);
    let ok = true;
    let formError: string | undefined;
    for (let step = 0; step < Math.abs(steps); step++) {
      const result = await moveProposalSection(proposalId, sectionId, direction);
      if (!result.ok) {
        ok = false;
        formError = result.formError;
        break;
      }
    }
    setIsMoving(false);
    announce?.(
      ok
        ? `Moved ${run.title} to a new position in the document.`
        : formError ?? `Could not move ${run.title}.`
    );
    router.refresh();
  }

  const { getHandleProps, setItemRef, draggingIndex, hoveredGap, isDragging, consumeJustDragged } =
    usePointerReorder({
      itemCount: runs.length,
      containerRef: navRef,
      onReorder: handleReorder,
      disabled: !dragActive,
    });

  return (
    <div className="flex h-full min-h-0 flex-col bg-editor-panel-muted">
      <EditorPanelHeader
        icon={<Layers3 className="size-4" />}
        label="Pages"
        count={pageMeta.length}
        onClose={onClose}
        closeLabel="Close page navigator"
      />

      <div className="p-3">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-editor-border bg-editor-raised px-3 text-editor-text-muted focus-within:border-editor-border-strong focus-within:ring-2 focus-within:ring-editor-border-strong/20">
          <Search className="size-4" aria-hidden="true" />
          <span className="sr-only">Search proposal pages</span>
          <input
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Find a page"
            className="min-w-0 flex-1 bg-transparent text-sm text-editor-text-strong outline-none placeholder:text-editor-text-subtle"
          />
        </label>
      </div>

      <nav ref={navRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-3" aria-label="Proposal pages">
        {filteredPages.map((page) => {
          const active = page.id === selectedPage.id;
          const runIndex = runIndexByPageId.get(page.id);
          const isRunStart = runIndex != null;
          const showHandle = dragActive && isRunStart;
          const dragging = isDragging && draggingIndex === runIndex;
          const dropIndicator =
            isDragging && isRunStart && hoveredGap != null
              ? hoveredGap === runIndex
                ? "before"
                : hoveredGap === runs.length && runIndex === runs.length - 1
                  ? "after"
                  : undefined
              : undefined;

          return (
            <EditorPageCard
              key={page.id}
              cardRef={isRunStart ? setItemRef(runIndex) : undefined}
              active={active}
              pageNumber={page.pageNumber}
              title={page.title}
              description={page.description}
              eyebrow={page.eyebrow}
              thumbnail={<PageThumbnail page={pages[page.pageNumber - 1]} pageSize={pageSize} />}
              thumbnailHeight={(48 * pageSize.heightPx) / pageSize.widthPx}
              status={page.status}
              dragging={dragging}
              dropIndicator={dropIndicator}
              dragHandle={
                showHandle ? (
                  <span {...getHandleProps(runIndex)}>
                    <GripVertical className="size-4" />
                  </span>
                ) : undefined
              }
              onSelect={() => {
                if (consumeJustDragged()) return;
                onSelect(page);
              }}
            />
          );
        })}
        {filteredPages.length === 0 ? (
          <EditorEmptyState
            compact
            title="No matching pages"
            description="Try a page number, title, or section name."
            icon={<Search className="size-5" />}
          />
        ) : null}
      </nav>

      <div className="border-t border-editor-border-subtle px-4 py-3 text-xs text-editor-text-muted">
        {pageMeta.length} rendered pages
      </div>
    </div>
  );
}
