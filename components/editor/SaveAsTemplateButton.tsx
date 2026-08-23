"use client";

import { Check, LibraryBig, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { saveCurrentProposalAsTemplateAction } from "@/app/proposals/[id]/editor/templateActions";

import { EditorButton, EditorNotice, editorFocusRing } from "./EditorUi";

export default function SaveAsTemplateButton({ proposalId }: { proposalId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const trigger = triggerRef.current;
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    focusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
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
  }, [open]);

  async function submit() {
    setLoading(true);
    setError("");
    const result = await saveCurrentProposalAsTemplateAction(proposalId, { name, description: description || undefined });
    setLoading(false);
    if (!result.ok) {
      setError(result.formError ?? "The template could not be saved.");
      return;
    }
    setSaved(true);
  }

  function closeAndReset() {
    setOpen(false);
    setSaved(false);
    setName("");
    setDescription("");
    setError("");
  }

  return (
    <>
      <EditorButton ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="Save as template" title="Save as template">
        <LibraryBig className="size-4" aria-hidden="true" />
        <span className="hidden xl:inline">Save as template</span>
      </EditorButton>
      {open ? (
        <div ref={dialogRef} className="fixed inset-0 z-[70] grid place-items-center bg-editor-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="save-template-title">
          <div className="w-full max-w-md rounded-2xl border border-editor-border bg-editor-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-editor-brand">
                  <LibraryBig className="size-4" aria-hidden="true" />
                  <h2 id="save-template-title" className="text-lg font-semibold">Save as template</h2>
                </div>
                <p className="mt-1 text-sm leading-5 text-editor-text-muted">Saves a snapshot of this proposal. Later edits here never change the template.</p>
              </div>
              <EditorButton type="button" variant="ghost" size="icon" onClick={closeAndReset} aria-label="Close save as template dialog"><X className="size-5" aria-hidden="true" /></EditorButton>
            </div>
            {saved ? (
              <div className="mt-5">
                <EditorNotice tone="success" title="Template saved">Find it under Templates in the proposals list.</EditorNotice>
                <EditorButton type="button" variant="primary" className="mt-3 w-full" onClick={closeAndReset}>
                  <Check className="size-4" aria-hidden="true" />
                  Done
                </EditorButton>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <label className="block text-xs font-semibold text-editor-text">
                  Template name
                  <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="e.g. Classic Tanzania Safari" className={`mt-1.5 h-11 w-full rounded-lg border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`} />
                </label>
                <label className="block text-xs font-semibold text-editor-text">
                  Description (optional)
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} className={`mt-1.5 h-20 w-full resize-none rounded-lg border border-editor-border bg-editor-raised px-3 py-2 text-sm ${editorFocusRing}`} />
                </label>
                {error ? <EditorNotice tone="danger" className="px-3 py-2 text-xs">{error}</EditorNotice> : null}
                <EditorButton type="button" variant="primary" className="w-full" disabled={loading} onClick={() => void submit()}>{loading ? "Saving…" : "Save template"}</EditorButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
