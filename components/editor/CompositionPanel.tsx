"use client";

import {
  ArrowDown,
  ArrowUp,
  BookmarkSimple,
  Copy,
  Eye,
  EyeSlash,
  FilePlus,
  TreeStructure,
  ArrowCounterClockwise,
  Trash,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addProposalSection,
  duplicateProposalSection,
  moveProposalSection,
  setProposalSectionDeleted,
  setProposalSectionHidden,
} from "@/app/proposals/[id]/editor/compositionActions";
import { saveProposalSectionToLibrary } from "@/app/proposals/[id]/editor/libraryActions";
import type { ProposalCompositionData } from "@/lib/composition/types";
import type { ProposalDesignContext, ProposalSectionType } from "@/lib/designs/types";
import { ADDABLE_SECTIONS } from "@/lib/editor/addableSections";

import { EditorButton, EditorNotice, EditorPanelHeader, EditorStatusBadge, editorFocusRing } from "./EditorUi";

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
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [libraryDraft, setLibraryDraft] = useState({ name: "", description: "", tags: "" });

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
      <EditorPanelHeader icon={<TreeStructure className="size-4" />} label="Document structure" count={items.filter((item) => !item.deleted).length} onClose={onClose} closeLabel="Close document structure" />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="rounded-editor-lg border border-editor-border-subtle bg-editor-inset p-3.5">
          <h2 className="text-sm font-semibold text-editor-text">Add an approved section</h2>
          <p className="mt-1 text-xs leading-4 text-editor-text-muted">Catalog-backed sections are added from Catalog. These blocks use safe defaults from {designContext.active.name}.</p>
          <div className="mt-3 flex gap-2">
            <select aria-label="Section type to add" value={newType} onChange={(event) => setNewType(event.target.value as ProposalSectionType)} className={`h-11 min-w-0 flex-1 rounded-editor-md border border-editor-border bg-editor-raised px-2.5 text-xs font-semibold text-editor-text ${editorFocusRing}`}>
              {ADDABLE_SECTIONS.filter((item) => designContext.active.supportedSectionTypes.includes(item.type)).map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
            </select>
            <EditorButton type="button" variant="primary" size="sm" disabled={pending === "add"} onClick={async () => {
              if (await mutate("add", () => addProposalSection(proposalId, newType))) router.refresh();
            }}><FilePlus className="size-4" /> Add</EditorButton>
          </div>
        </div>

        {error ? <EditorNotice tone="danger" className="mt-3 px-3 py-2 text-xs">{error}</EditorNotice> : null}

        <div className="mt-4 space-y-2">
          {items.map((item, index) => (
            <article key={item.id} className={`rounded-editor-lg border p-3 ${item.deleted ? "border-editor-danger-border bg-editor-danger-surface opacity-75" : item.hidden ? "border-editor-warning-border bg-editor-warning-surface" : "border-editor-border-subtle bg-editor-raised"}`}>
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
                  }}><ArrowCounterClockwise className="size-3.5" /> Restore</EditorButton>
                ) : (
                  <>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={index === 0 || pending === `move-${item.id}`} onClick={() => void move(index, -1)} aria-label={`Move ${item.label} up`}><ArrowUp className="size-3.5" /></EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={index === items.length - 1 || pending === `move-${item.id}`} onClick={() => void move(index, 1)} aria-label={`Move ${item.label} down`}><ArrowDown className="size-3.5" /></EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={pending === `hide-${item.id}`} onClick={async () => {
                      if (await mutate(`hide-${item.id}`, () => setProposalSectionHidden(proposalId, item.id, !item.hidden))) setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, hidden: !candidate.hidden } : candidate));
                    }} aria-label={item.hidden ? `Show ${item.label}` : `Hide ${item.label}`}>{item.hidden ? <Eye className="size-3.5" /> : <EyeSlash className="size-3.5" />}</EditorButton>
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={pending === `copy-${item.id}`} onClick={() => void mutate(`copy-${item.id}`, () => duplicateProposalSection(proposalId, item.id))} aria-label={`Duplicate ${item.label}`}><Copy className="size-3.5" /></EditorButton>
                    {item.reusable ? <EditorButton type="button" variant="ghost" size="icon" className="size-9" onClick={() => { setSavingItemId(item.id); setLibraryDraft({ name: item.label, description: "", tags: "" }); }} aria-label={`Save ${item.label} to library`}><BookmarkSimple className="size-3.5" /></EditorButton> : null}
                    <EditorButton type="button" variant="ghost" size="icon" className="size-9 text-editor-danger" disabled={pending === `delete-${item.id}`} onClick={async () => {
                      if (!window.confirm(`Delete ${item.label}? You can restore it from this panel.`)) return;
                      if (await mutate(`delete-${item.id}`, () => setProposalSectionDeleted(proposalId, item.id, true))) setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, deleted: true, hidden: true } : candidate));
                    }} aria-label={`Delete ${item.label}`}><Trash className="size-3.5" /></EditorButton>
                  </>
                )}
              </div>
              {savingItemId === item.id ? (
                <div className="mt-3 space-y-2 border-t border-editor-border-subtle pt-3">
                  <p className="text-xs font-semibold text-editor-text">Save reusable section</p>
                  <input aria-label="Saved section name" value={libraryDraft.name} onChange={(event) => setLibraryDraft((current) => ({ ...current, name: event.target.value }))} className={`h-11 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm text-editor-text ${editorFocusRing}`} placeholder="Section name" />
                  <textarea aria-label="Saved section description" value={libraryDraft.description} onChange={(event) => setLibraryDraft((current) => ({ ...current, description: event.target.value }))} className={`w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 py-2 text-sm text-editor-text ${editorFocusRing}`} rows={2} placeholder="Optional description" />
                  <input aria-label="Saved section tags" value={libraryDraft.tags} onChange={(event) => setLibraryDraft((current) => ({ ...current, tags: event.target.value }))} className={`h-11 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm text-editor-text ${editorFocusRing}`} placeholder="Tags, separated by commas" />
                  <div className="flex gap-2"><EditorButton type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setSavingItemId(null)}>Cancel</EditorButton><EditorButton type="button" variant="primary" size="sm" className="flex-1" disabled={pending === `save-library-${item.id}`} onClick={async () => {
                    const ok = await mutate(`save-library-${item.id}`, () => saveProposalSectionToLibrary(proposalId, item.id, { name: libraryDraft.name, description: libraryDraft.description, tags: libraryDraft.tags.split(",") }));
                    if (ok) setSavingItemId(null);
                  }}><BookmarkSimple className="size-3.5" /> Save</EditorButton></div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
