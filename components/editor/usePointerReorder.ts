"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVATION_THRESHOLD_PX = 6;
const AUTO_SCROLL_EDGE_PX = 40;
const AUTO_SCROLL_SPEED_PX = 12;

interface UsePointerReorderOptions {
  itemCount: number;
  containerRef: React.RefObject<HTMLElement | null>;
  onReorder: (fromIndex: number, toGapIndex: number) => void;
  disabled?: boolean;
}

interface DragStart {
  pointerId: number;
  index: number;
  x: number;
  y: number;
}

/**
 * Custom pointer-based reorder mechanics for a vertically stacked list.
 * Emits gap indices (0..itemCount) rather than mutating anything itself —
 * callers translate a (fromIndex, toGapIndex) drop into their own domain.
 */
export function usePointerReorder({ itemCount, containerRef, onReorder, disabled }: UsePointerReorderOptions) {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoveredGap, setHoveredGap] = useState<number | null>(null);
  const startRef = useRef<DragStart | null>(null);
  const movedRef = useRef(false);
  const justDraggedRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const pointerYRef = useRef(0);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const computeGap = useCallback(
    (clientY: number) => {
      let gap = 0;
      for (let i = 0; i < itemRefs.current.length; i++) {
        const rect = itemRefs.current[i]?.getBoundingClientRect();
        if (!rect) continue;
        const midpoint = rect.top + rect.height / 2;
        if (clientY > midpoint) gap = i + 1;
      }
      return Math.min(gap, itemCount);
    },
    [itemCount]
  );

  const stopAutoScroll = useCallback(() => {
    if (scrollFrameRef.current != null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const endDrag = useCallback(
    (commit: boolean) => {
      stopAutoScroll();
      const start = startRef.current;
      const gap = hoveredGap;
      startRef.current = null;
      setDraggingIndex(null);
      setHoveredGap(null);
      if (commit && start && gap != null && gap !== start.index && gap !== start.index + 1) {
        onReorder(start.index, gap);
      }
      if (movedRef.current) {
        justDraggedRef.current = true;
        window.setTimeout(() => {
          justDraggedRef.current = false;
        }, 300);
      }
      movedRef.current = false;
    },
    [hoveredGap, onReorder, stopAutoScroll]
  );

  useEffect(() => {
    if (draggingIndex == null) return;

    function onPointerMove(event: PointerEvent) {
      pointerYRef.current = event.clientY;
      const start = startRef.current;
      if (!start) return;
      if (!movedRef.current) {
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.hypot(dx, dy) < ACTIVATION_THRESHOLD_PX) return;
        movedRef.current = true;
      }
      setHoveredGap(computeGap(event.clientY));
    }

    function onPointerUp() {
      endDrag(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") endDrag(false);
    }

    function tickAutoScroll() {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const y = pointerYRef.current;
        if (y < rect.top + AUTO_SCROLL_EDGE_PX) {
          container.scrollTop -= AUTO_SCROLL_SPEED_PX;
        } else if (y > rect.bottom - AUTO_SCROLL_EDGE_PX) {
          container.scrollTop += AUTO_SCROLL_SPEED_PX;
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
  }, [computeGap, containerRef, draggingIndex, endDrag, stopAutoScroll]);

  const getHandleProps = useCallback(
    (index: number) => ({
      onPointerDown: (event: React.PointerEvent) => {
        if (disabled || event.button !== 0) return;
        event.stopPropagation();
        event.preventDefault();
        startRef.current = { pointerId: event.pointerId, index, x: event.clientX, y: event.clientY };
        movedRef.current = false;
        pointerYRef.current = event.clientY;
        setDraggingIndex(index);
        setHoveredGap(index);
      },
    }),
    [disabled]
  );

  return {
    getHandleProps,
    setItemRef,
    draggingIndex,
    hoveredGap,
    isDragging: draggingIndex != null,
    consumeJustDragged: () => {
      if (!justDraggedRef.current) return false;
      justDraggedRef.current = false;
      return true;
    },
  };
}
