"use client";

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, FilePlus2, ListTree, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addProposalSection,
  duplicateProposalSection,
  moveProposalSection,
  setProposalSectionDeleted,
  setProposalSectionHidden,
} from "@/app/proposals/[id]/editor/compositionActions";
import type { ProposalCompositionData } from "@/lib/composition/types";
import type { ProposalDesignContext, ProposalSectionType } from "@/lib/designs/types";

import { EditorButton, EditorNotice, EditorPanelHeader, EditorStatusBadge, editorFocusRing } from "./EditorUi";

const ADDABLE: Array<{ type: ProposalSectionType; label: string }> = [
  { type: "triangleDivider", label: "Image title divider" },
  { type: "sectionDivider", label: "Editorial section divider" },
  { type: "thankYou", label: "Thank-you page" },
];

export default function CompositionPanel({ proposalId, composition, designContext, onClose }: {
  proposalId: number;
  composition: ProposalCompositionData;
  designContext: ProposalDesignContext;
  onClose: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState(composition.items);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [newType, setNewType] = useState<ProposalSectionType>("triangleDivider");

  async function mutate(key: string, action: () => Promise<{ ok: boolean; formError?: string }>) {
    setPending(key);
    setError("");
    const result = await action();
    setPending("");
    if (!result.ok) {
      setError(result.formError ?? "The document structure could not be changed.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function move(index: number, direction: -1 | 1) {
    const item = items[index];
    if (!item || !(await mutate(`move-${item.id}`, () => moveProposalSection(proposalId, item.id, direction)))) return;
    const next = [...items];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-editor-panel">
      <EditorPanelHeader icon={<ListTree className="size-4" />} label="Document structure" count={items.filter((item) => !item.deleted).length} onClose={onClose} closeLabel="Close document structure" />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="rounded-xl border border-editor-border-subtle bg-editor-inset p-3.5">
          <h2 className="text-sm font-semibold text-editor-text">Add an approved section</h2>
          <p className="mt-1 text-xs leading-4 text-editor-text-muted">Catalog-backed sections are added from Catalog. These blocks use safe defaults from {designContext.active.name}.</p>
          <div className="mt-3 flex gap-2">
            <select aria-label="Section type to add" value={newType} onChange={(event) => setNewType(event.target.value as ProposalSectionType)} className={`h-11 min-w-0 flex-1 rounded-lg border border-editor-border bg-editor-raised px-2.5 text-xs font-semibold text-editor-text ${editorFocusRing}`}>
              {ADDABLE.filter((item) => designContext.active.supportedSectionTypes.includes(item.type)).map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
            </select>
            <EditorButton type="button" variant="primary" size="sm" disabled={pending === "add"} onClick={async () => {
              if (await mutate("add", () => addProposalSection(proposalId, newType))) router.refresh();
            }}><FilePlus2 className="size-4" /> Add</EditorButton>
          </div>
        </div>

        {error ? <EditorNotice tone="danger" className="mt-3 px-3 py-2 text-xs">{error}</EditorNotice> : null}

        <div className="mt-4 space-y-2">
          {items.map((item, index) => (
            <article key={item.id} className={`rounded-xl border p-3 ${item.deleted ? "border-editor-danger-border bg-editor-danger-surface opacity-75" : item.hidden ? "border-editor-warning-border bg-editor-warning-surface" : "border-editor-border-subtle bg-editor-raised"}`}>
              <div className="flex items-start gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-editor-inset text-[11px] font-bold tabular-nums text-editor-text">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-editor-text">{item.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-editor-text-muted">{item.sectionType}</p>
                </div>
                {item.deleted ? <EditorStatusBadge tone="danger">Deleted</EditorStatusBadge> : item.hidden ? <EditorStatusBadge tone="warning">Hidden</EditorStatusBadge> : <EditorStatusBadge tone="success">Visible</EditorStatusBadge>}
              </div>
              <div className="mt-2.5 flex flex-wrap justify-end gap-1">
                {item.deleted ? (
                  <EditorButton type="button" variant="secondary" size="sm" disabled={pending === `restore-${item.id}`} onClick={async () => {
                    if (await mutate(`restore-${item.id}`, () => setProposalSectionDeleted(proposalId, item.id, false))) setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, deleted: false, hidden: false } : candidate));
                  }}><RotateCcw className="size-3.5" /> Restore</EditorButton>
                ) : (
                  <>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={index === 0 || pending === `move-${item.id}`} onClick={() => void move(index, -1)} aria-label={`Move ${item.label} up`}><ArrowUp className="size-3.5" /></EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={index === items.length - 1 || pending === `move-${item.id}`} onClick={() => void move(index, 1)} aria-label={`Move ${item.label} down`}><ArrowDown className="size-3.5" /></EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={pending === `hide-${item.id}`} onClick={async () => {
                      if (await mutate(`hide-${item.id}`, () => setProposalSectionHidden(proposalId, item.id, !item.hidden))) setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, hidden: !candidate.hidden } : candidate));
                    }} aria-label={item.hidden ? `Show ${item.label}` : `Hide ${item.label}`}>{item.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}</EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={pending === `copy-${item.id}`} onClick={() => void mutate(`copy-${item.id}`, () => duplicateProposalSection(proposalId, item.id))} aria-label={`Duplicate ${item.label}`}><Copy className="size-3.5" /></EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9 text-editor-danger" disabled={pending === `delete-${item.id}`} onClick={async () => {
                      if (!window.confirm(`Delete ${item.label}? You can restore it from this panel.`)) return;
                      if (await mutate(`delete-${item.id}`, () => setProposalSectionDeleted(proposalId, item.id, true))) setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, deleted: true, hidden: true } : candidate));
                    }} aria-label={`Delete ${item.label}`}><Trash2 className="size-3.5" /></EditorButton>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
