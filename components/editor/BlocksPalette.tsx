"use client";

import { DotsSixVertical } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addProposalSection } from "@/app/proposals/[id]/editor/compositionActions";
import type { ProposalDesignContext } from "@/lib/designs/types";
import { ADDABLE_SECTIONS } from "@/lib/editor/addableSections";

import { EditorButton, EditorNotice, editorFocusRing } from "./EditorUi";
import { DEFAULT_TEMPLATE_ICON, SECTION_TYPE_ICONS } from "./sectionTypeIcons";
import type { CatalogDragItem } from "./useCatalogDragInsert";

export default function BlocksPalette({
  proposalId,
  designContext,
  enableDrag,
  onDragStart,
}: {
  proposalId: number;
  designContext: ProposalDesignContext;
  enableDrag?: boolean;
  onDragStart?: (item: CatalogDragItem, event: React.PointerEvent) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  const blocks = ADDABLE_SECTIONS.filter((item) => designContext.active.supportedSectionTypes.includes(item.type));

  async function add(type: (typeof blocks)[number]["type"]) {
    setPending(type);
    setError("");
    const result = await addProposalSection(proposalId, type, undefined);
    setPending("");
    if (!result.ok) {
      setError(result.formError ?? "The block could not be added.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <EditorNotice tone="danger" className="mb-3 px-3 py-2 text-xs">{error}</EditorNotice> : null}
      <div className="grid grid-cols-2 gap-3">
        {blocks.map((item) => {
          const Icon = SECTION_TYPE_ICONS[item.type] ?? DEFAULT_TEMPLATE_ICON;
          return (
            <article key={item.type} className="relative flex flex-col items-center gap-2 rounded-editor-lg border border-editor-border-subtle bg-editor-raised p-3.5 pt-8 text-center">
              {enableDrag ? (
                <button
                  type="button"
                  onPointerDown={(event) => onDragStart?.({ kind: "template", sectionType: item.type, label: item.label }, event)}
                  aria-label={`Drag ${item.label} to a position in the document`}
                  className={`absolute left-1.5 top-1.5 grid size-7 shrink-0 cursor-grab place-items-center rounded-editor-sm text-editor-text-subtle hover:bg-editor-inset hover:text-editor-text active:cursor-grabbing ${editorFocusRing}`}
                >
                  <DotsSixVertical className="size-4" aria-hidden="true" />
                </button>
              ) : null}
              <div className="grid size-10 place-items-center rounded-full bg-editor-inset text-editor-brand">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xs font-semibold leading-4 text-editor-text">{item.label}</h3>
              <EditorButton type="button" variant="primary" size="sm" className="w-full" disabled={pending === item.type} onClick={() => void add(item.type)}>
                {pending === item.type ? "Adding…" : "Add to proposal"}
              </EditorButton>
            </article>
          );
        })}
      </div>
    </div>
  );
}
