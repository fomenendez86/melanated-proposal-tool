"use client";

import {
  Check,
  Copy,
  LinkSimple,
  ShareNetwork,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { createProposalShare } from "@/app/proposals/[id]/editor/shareActions";

import { EditorButton, EditorNotice, editorFocusRing } from "./EditorUi";

export default function ShareProposalButton({ proposalId, disabled }: { proposalId: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("30");
  const [path, setPath] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const url = path && typeof window !== "undefined" ? `${window.location.origin}${path}` : "";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const trigger = triggerRef.current;
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
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

  async function create() {
    setLoading(true);
    setError("");
    setCopied(false);
    const result = await createProposalShare(proposalId, { password, expiresInDays: Number(days) });
    setLoading(false);
    if (!result.ok || !result.path) {
      setError(result.formError ?? "The share link could not be created.");
      return;
    }
    setPath(result.path);
  }

  return (
    <>
      <EditorButton ref={triggerRef} type="button" variant="primary" disabled={disabled} onClick={() => setOpen(true)} aria-label="Share proposal" title={disabled ? "Save the proposal before sharing" : "Share proposal"}>
        <ShareNetwork className="size-4" aria-hidden="true" />
        <span className="hidden xl:inline">Share</span>
      </EditorButton>
      {open ? (
        <div ref={dialogRef} className="fixed inset-0 z-[70] grid place-items-center bg-editor-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
          <div className="w-full max-w-md rounded-editor-lg border border-editor-border bg-editor-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-editor-brand">
                  <LinkSimple className="size-4" aria-hidden="true" />
                  <h2 id="share-dialog-title" className="text-lg font-semibold">Share client revision</h2>
                </div>
                <p className="mt-1 text-sm leading-5 text-editor-text-muted">Creates an immutable snapshot so later edits do not change what the client sees.</p>
              </div>
              <EditorButton type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close share dialog"><X className="size-5" aria-hidden="true" /></EditorButton>
            </div>
            {path ? (
              <div className="mt-5">
                <EditorNotice tone="success" title="Share link ready">This revision expires in {days} days{password ? " and requires the password you set" : ""}.</EditorNotice>
                <div className="mt-3 flex gap-2">
                  <input readOnly value={url} aria-label="Share URL" className={`h-11 min-w-0 flex-1 rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`} />
                  <EditorButton type="button" variant="primary" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}>
                    {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}{copied ? "Copied" : "Copy"}
                  </EditorButton>
                </div>
                <a href={path} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-editor-brand underline">Open shared proposal</a>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <label className="block text-xs font-semibold text-editor-text">Expiration
                  <select value={days} onChange={(event) => setDays(event.target.value)} className={`mt-1.5 h-11 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`}>
                    <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-editor-text">Optional password
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={`mt-1.5 h-11 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`} />
                </label>
                {error ? <EditorNotice tone="danger" className="px-3 py-2 text-xs">{error}</EditorNotice> : null}
                <EditorButton type="button" variant="primary" className="w-full" disabled={loading} onClick={() => void create()}>{loading ? "Creating revision…" : "Create share link"}</EditorButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
