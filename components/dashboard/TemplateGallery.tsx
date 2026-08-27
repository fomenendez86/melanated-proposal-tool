"use client";

import {
  Archive,
  ArrowUUpLeft,
  Books,
  PencilLine,
  ArrowsClockwise,
  X,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  archiveTemplateAction,
  renameTemplateAction,
  restoreTemplateAction,
  updateTemplateFromProposalAction,
} from "@/app/proposals/templateActions";
import AppShell from "@/components/app/AppShell";
import { EditorButton, EditorEmptyState, EditorNotice, EditorStatusBadge, editorFocusRing } from "@/components/editor/EditorUi";
import type { TemplateListRow } from "@/lib/db/getTemplateList";

const inputClass = `h-11 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`;

function ManageTemplateDialog({
  template,
  sourceProposals,
  onClose,
}: {
  template: TemplateListRow;
  sourceProposals: { id: number; title: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [sourceProposalId, setSourceProposalId] = useState(sourceProposals[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const [savingRefresh, setSavingRefresh] = useState(false);
  const triggerWasFocused = useRef(document.activeElement as HTMLElement | null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerWasFocused.current;
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    focusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [onClose]);

  async function submitRename() {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a template name.");
      return;
    }
    setSavingRename(true);
    const result = await renameTemplateAction(template.id, { name: trimmed, description: description || undefined });
    setSavingRename(false);
    if (!result.ok) {
      setError(result.formError ?? "The template could not be renamed.");
      return;
    }
    router.refresh();
    onClose();
  }

  async function submitRefresh() {
    setError("");
    if (!sourceProposalId) {
      setError("Choose a proposal to refresh from.");
      return;
    }
    setSavingRefresh(true);
    const result = await updateTemplateFromProposalAction(template.id, sourceProposalId);
    setSavingRefresh(false);
    if (!result.ok) {
      setError(result.formError ?? "The template could not be updated.");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[70] grid place-items-center bg-editor-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="manage-template-title">
      <div className="w-full max-w-md rounded-editor-lg border border-editor-border bg-editor-panel p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-editor-brand">
            <PencilLine className="size-4" aria-hidden="true" />
            <h2 id="manage-template-title" className="text-lg font-semibold">Manage template</h2>
          </div>
          <EditorButton type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close manage template dialog">
            <X className="size-5" aria-hidden="true" />
          </EditorButton>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-editor-text">
            Name
            <input aria-label="Template name" className={`mt-1.5 ${inputClass}`} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          </label>
          <label className="block text-xs font-semibold text-editor-text">
            Description
            <textarea aria-label="Template description" className={`mt-1.5 ${inputClass} h-20 resize-none py-2`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} />
          </label>
          <EditorButton type="button" variant="primary" className="w-full" disabled={savingRename} onClick={() => void submitRename()}>
            {savingRename ? "Saving…" : "Save name & description"}
          </EditorButton>

          <div className="border-t border-editor-border-subtle pt-4">
            <span className="text-xs font-semibold text-editor-text">Refresh content from a proposal</span>
            <p className="mt-1 text-xs leading-5 text-editor-text-muted">
              Replaces this template&apos;s content with a fresh copy from the proposal below. Proposals already created from this template are not affected.
            </p>
            <select aria-label="Source proposal" className={`mt-2 ${inputClass}`} value={sourceProposalId} onChange={(event) => setSourceProposalId(Number(event.target.value))}>
              {sourceProposals.length === 0 ? <option value={0}>No proposals available</option> : null}
              {sourceProposals.map((proposal) => (
                <option key={proposal.id} value={proposal.id}>{proposal.title}</option>
              ))}
            </select>
            <EditorButton type="button" variant="secondary" className="mt-2 w-full" disabled={savingRefresh} onClick={() => void submitRefresh()}>
              <ArrowsClockwise className="size-4" aria-hidden="true" />
              {savingRefresh ? "Refreshing…" : "Refresh from proposal"}
            </EditorButton>
          </div>

          {error ? <EditorNotice tone="danger" className="px-3 py-2 text-xs">{error}</EditorNotice> : null}
        </div>
      </div>
    </div>
  );
}

export default function TemplateGallery({
  templates,
  sourceProposals,
}: {
  templates: TemplateListRow[];
  sourceProposals: { id: number; title: string }[];
}) {
  const router = useRouter();
  const [managingId, setManagingId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const managing = templates.find((template) => template.id === managingId) ?? null;

  async function runAction(id: number, action: () => Promise<{ ok: boolean; formError?: string }>) {
    setError("");
    setPendingId(id);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(result.formError ?? "That action could not be completed.");
      return;
    }
    router.refresh();
  }

  return (
    <AppShell
      active="templates"
      title="Templates"
      subtitle={`${templates.length} template${templates.length === 1 ? "" : "s"} · saved from the editor`}
      backHref="/proposals"
    >
      <div className="app-page">

      {error ? <p className="text-sm font-semibold text-editor-danger">{error}</p> : null}

      {templates.length === 0 ? (
        <EditorEmptyState
          icon={<Books className="size-5" aria-hidden="true" />}
          title="No templates yet"
          description={'Open a proposal in the editor and use "Save as template" to create one.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {templates.map((template) => (
            <div key={template.id} className="app-card flex flex-col overflow-hidden rounded-editor-lg">
              <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-gradient-to-br from-editor-brand to-editor-brand-hover">
                {template.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.thumbnailUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Books className="size-8 text-white/80" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-editor-text-strong">{template.name}</h2>
                  <EditorStatusBadge tone={template.status === "archived" ? "neutral" : "success"} className="capitalize">{template.status}</EditorStatusBadge>
                </div>
                {template.description ? <p className="line-clamp-2 text-xs text-editor-text-muted">{template.description}</p> : null}
                <p className="text-xs text-editor-text-subtle">{template.designName}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-2">
                  <EditorButton type="button" variant="secondary" size="sm" aria-label={`Manage ${template.name}`} onClick={() => setManagingId(template.id)}>
                    <PencilLine className="size-4" aria-hidden="true" />
                    Manage
                  </EditorButton>
                  {template.status === "archived" ? (
                    <EditorButton type="button" variant="ghost" size="icon" aria-label={`Restore ${template.name}`} disabled={pendingId === template.id} onClick={() => void runAction(template.id, () => restoreTemplateAction(template.id))}>
                      <ArrowUUpLeft className="size-4" aria-hidden="true" />
                    </EditorButton>
                  ) : (
                    <EditorButton type="button" variant="ghost" size="icon" aria-label={`Archive ${template.name}`} disabled={pendingId === template.id} onClick={() => void runAction(template.id, () => archiveTemplateAction(template.id))}>
                      <Archive className="size-4" aria-hidden="true" />
                    </EditorButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {managing ? (
        <ManageTemplateDialog template={managing} sourceProposals={sourceProposals} onClose={() => setManagingId(null)} />
      ) : null}
      </div>
    </AppShell>
  );
}
