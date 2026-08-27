"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { addCatalogExcursionToProposal, addCatalogHotelToProposal } from "@/app/proposals/[id]/editor/catalogActions";
import { addProposalSection } from "@/app/proposals/[id]/editor/compositionActions";
import { insertLibrarySection } from "@/app/proposals/[id]/editor/libraryActions";
import type { ProposalSectionType } from "@/lib/designs/types";
import type { SectionRun } from "@/lib/editor/sectionRuns";

const ACTIVATION_THRESHOLD_PX = 6;
const AUTO_SCROLL_EDGE_PX = 40;
const AUTO_SCROLL_SPEED_PX = 12;

export type CatalogDragItem =
  | { kind: "hotel" | "excursion" | "savedSection"; id: number; label: string }
  | { kind: "template"; sectionType: ProposalSectionType; label: string };

interface UseCatalogDragInsertOptions {
  proposalId: number;
  sectionRuns: SectionRun[];
  runStartPageIndexes: number[];
  pageRefs: RefObject<Array<HTMLDivElement | null>>;
  canvasViewportRef: RefObject<HTMLDivElement | null>;
  announce: (message: string) => void;
}

/**
 * Pointer-based drag from a catalog card (a different component tree) to an
 * insertion gap in the canvas. Mirrors usePointerReorder's mechanics
 * (activation threshold, window listeners, Escape-cancel, auto-scroll), but
 * the drop target is computed from the canvas's own page rects instead of a
 * single list's item rects, since the drag source and target live in
 * separate panels.
 */
export function useCatalogDragInsert({
  proposalId,
  sectionRuns,
  runStartPageIndexes,
  pageRefs,
  canvasViewportRef,
  announce,
}: UseCatalogDragInsertOptions) {
  const router = useRouter();
  const [draggingItem, setDraggingItem] = useState<CatalogDragItem | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAfterSectionId, setHoveredAfterSectionId] = useState<number | null | undefined>(undefined);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const hoveredRef = useRef<number | null | undefined>(undefined);
  const scrollFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const computeHoveredAfterSectionId = useCallback(
    (clientX: number, clientY: number): number | null | undefined => {
      const viewport = canvasViewportRef.current;
      if (!viewport) return undefined;
      const viewportRect = viewport.getBoundingClientRect();
      if (clientX < viewportRect.left || clientX > viewportRect.right || clientY < viewportRect.top || clientY > viewportRect.bottom) {
        return undefined;
      }
      let gap = 0;
      for (let g = 0; g < runStartPageIndexes.length; g++) {
        const rect = pageRefs.current[runStartPageIndexes[g]]?.getBoundingClientRect();
        if (!rect) continue;
        if (clientY > rect.top) gap = g + 1;
      }
      if (sectionRuns.length === 0) return undefined;
      return gap === 0 ? null : sectionRuns[gap - 1].sectionId;
    },
    [canvasViewportRef, pageRefs, runStartPageIndexes, sectionRuns]
  );

  const stopAutoScroll = useCallback(() => {
    if (scrollFrameRef.current != null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const endDrag = useCallback(
    async (commit: boolean) => {
      stopAutoScroll();
      const item = draggingItem;
      const afterSectionId = hoveredRef.current;
      setDraggingItem(null);
      setGhostPosition(null);
      setHoveredAfterSectionId(undefined);
      hoveredRef.current = undefined;
      startRef.current = null;
      movedRef.current = false;
      if (!commit || !item || afterSectionId === undefined) return;

      const result = item.kind === "template"
        ? await addProposalSection(proposalId, item.sectionType, afterSectionId)
        : item.kind === "hotel"
          ? await addCatalogHotelToProposal(proposalId, item.id, afterSectionId)
          : item.kind === "excursion"
            ? await addCatalogExcursionToProposal(proposalId, item.id, afterSectionId)
            : await insertLibrarySection(proposalId, item.id, afterSectionId);
      if (!result.ok) {
        announce(result.formError ?? `${item.label} could not be added.`);
        return;
      }
      announce(afterSectionId === null ? `Added ${item.label} at the start.` : `Added ${item.label} to the proposal.`);
      router.refresh();
    },
    [announce, draggingItem, proposalId, router, stopAutoScroll]
  );

  useEffect(() => {
    if (!draggingItem) return;

    function onPointerMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (!movedRef.current && startRef.current) {
        const dx = event.clientX - startRef.current.x;
        const dy = event.clientY - startRef.current.y;
        if (Math.hypot(dx, dy) < ACTIVATION_THRESHOLD_PX) return;
        movedRef.current = true;
      }
      setGhostPosition({ x: event.clientX, y: event.clientY });
      const next = computeHoveredAfterSectionId(event.clientX, event.clientY);
      hoveredRef.current = next;
      setHoveredAfterSectionId(next);
    }

    function onPointerUp() {
      void endDrag(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") void endDrag(false);
    }

    function tickAutoScroll() {
      const viewport = canvasViewportRef.current;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        const y = pointerRef.current.y;
        if (y > rect.top && y < rect.bottom) {
          if (y < rect.top + AUTO_SCROLL_EDGE_PX) viewport.scrollTop -= AUTO_SCROLL_SPEED_PX;
          else if (y > rect.bottom - AUTO_SCROLL_EDGE_PX) viewport.scrollTop += AUTO_SCROLL_SPEED_PX;
        }
      }
      scrollFrameRef.current = requestAnimationFrame(tickAutoScroll);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    scrollFrameRef.current = requestAnimationFrame(tickAutoScroll);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      stopAutoScroll();
    };
  }, [canvasViewportRef, computeHoveredAfterSectionId, draggingItem, endDrag, stopAutoScroll]);

  const startDrag = useCallback((item: CatalogDragItem, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    startRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    hoveredRef.current = undefined;
    setHoveredAfterSectionId(undefined);
    setGhostPosition({ x: event.clientX, y: event.clientY });
    setDraggingItem(item);
  }, []);

  return { startDrag, draggingItem, ghostPosition, hoveredAfterSectionId };
}
