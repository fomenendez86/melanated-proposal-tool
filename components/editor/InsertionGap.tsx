"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { addProposalSection } from "@/app/proposals/[id]/editor/compositionActions";
import type { ProposalDesignContext } from "@/lib/designs/types";
import { ADDABLE_SECTIONS } from "@/lib/editor/addableSections";

import { editorFocusRing } from "./EditorUi";

/**
 * Hover/focus affordance rendered in the gap between two rendered pages.
 * The "+" menu only offers template sections (dividers, thank-you) — a
 * catalog item dragged from the docked Catalog panel (Fase 11.2) can also
 * land here, in which case `highlighted` reflects that this gap is the
 * current drop target (computed centrally by useCatalogDragInsert, which
 * doesn't depend on this component rendering at all).
 */
export default function InsertionGap({
  proposalId,
  afterSectionId,
  positionLabel,
  designContext,
  announce,
  highlighted = false,
}: {
  proposalId: number;
  afterSectionId: number | null;
  positionLabel: string;
  designContext: ProposalDesignContext;
  announce: (message: string) => void;
  highlighted?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const options = ADDABLE_SECTIONS.filter((item) => designContext.active.supportedSectionTypes.includes(item.type));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (options.length === 0) return null;

  async function addAt(type: (typeof options)[number]["type"], label: string) {
    setPending(type);
    const result = await addProposalSection(proposalId, type, afterSectionId);
    setPending("");
    setOpen(false);
    if (!result.ok) {
      announce(result.formError ?? "The section could not be added.");
      return;
    }
    announce(`Added ${label} ${positionLabel}.`);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="group/gap relative w-full" style={{ height: 12 }}>
      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 transition ${
          highlighted ? "h-0.5 rounded-full bg-editor-brand opacity-100" : "h-px bg-editor-border-subtle opacity-0 group-hover/gap:opacity-100"
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Insert a section ${positionLabel}`}
        aria-expanded={open}
        className={`absolute left-1/2 top-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-sm transition focus-visible:opacity-100 ${editorFocusRing} ${
          highlighted
            ? "scale-110 border-editor-brand bg-editor-brand text-white opacity-100"
            : `border-editor-border bg-editor-raised text-editor-text-muted opacity-0 hover:border-editor-border-strong hover:text-editor-text group-hover/gap:opacity-100 ${open ? "opacity-100" : ""}`
        }`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Section to insert"
          className="absolute left-1/2 top-full z-20 mt-6 w-56 -translate-x-1/2 rounded-lg border border-editor-border bg-editor-panel p-1 shadow-lg"
        >
          {options.map((item) => (
            <button
              key={item.type}
              type="button"
              role="menuitem"
              disabled={pending === item.type}
              onClick={() => void addAt(item.type, item.label)}
              className={`flex h-11 w-full items-center rounded-md px-3 text-left text-sm text-editor-text transition hover:bg-editor-inset disabled:opacity-50 ${editorFocusRing}`}
            >
              {pending === item.type ? "Adding…" : item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
