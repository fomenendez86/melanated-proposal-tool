"use client";

import { FilePlus2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createProposal } from "@/app/proposals/actions";
import { EditorButton, EditorNotice, EditorSegmentedControl, editorFocusRing } from "@/components/editor/EditorUi";
import type { ClientOption } from "@/lib/db/getClientOptions";
import type { DocumentDesignDescriptor } from "@/lib/designs/types";

const inputClass = `h-11 w-full rounded-lg border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`;

export default function CreateProposalDialog({
  clients,
  designs,
  existingProposals,
  templates,
}: {
  clients: ClientOption[];
  designs: DocumentDesignDescriptor[];
  existingProposals: { id: number; title: string }[];
  templates: { id: number; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientMode, setClientMode] = useState<"existing" | "new">(clients.length > 0 ? "existing" : "new");
  const [existingClientId, setExistingClientId] = useState(clients[0]?.id ?? 0);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [tripName, setTripName] = useState("");
  const [designChoice, setDesignChoice] = useState(designs[0] ? `${designs[0].id}:${designs[0].version}` : "");
  const [origin, setOrigin] = useState<"blank" | "duplicate" | "template">("blank");
  const [sourceProposalId, setSourceProposalId] = useState(existingProposals[0]?.id ?? 0);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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

  async function submit() {
    setError("");
    const [designId, versionText] = designChoice.split(":");
    const designVersion = Number(versionText);
    if (!designId || !Number.isInteger(designVersion)) {
      setError("Choose a document design.");
      return;
    }
    if (origin === "duplicate" && !sourceProposalId) {
      setError("Choose a proposal to duplicate.");
      return;
    }
    if (origin === "template" && !templateId) {
      setError("Choose a template.");
      return;
    }
    setLoading(true);
    const result = await createProposal({
      tripName,
      designId,
      designVersion,
      client:
        clientMode === "existing"
          ? { mode: "existing", clientId: existingClientId }
          : { mode: "new", fullName: newClientName, email: newClientEmail || undefined },
      origin:
        origin === "blank"
          ? { type: "blank" }
          : origin === "duplicate"
            ? { type: "duplicate", sourceProposalId }
            : { type: "template", templateId },
    });
    setLoading(false);
    if (!result.ok || !result.id) {
      setError(result.formError ?? "The proposal could not be created.");
      return;
    }
    router.push(`/proposals/${result.id}/editor`);
  }

  return (
    <>
      <EditorButton ref={triggerRef} type="button" variant="primary" onClick={() => setOpen(true)}>
        <FilePlus2 className="size-4" aria-hidden="true" />
        New proposal
      </EditorButton>
      {open ? (
        <div ref={dialogRef} className="fixed inset-0 z-[70] grid place-items-center bg-editor-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="create-proposal-title">
          <div className="w-full max-w-md rounded-2xl border border-editor-border bg-editor-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-editor-brand">
                  <FilePlus2 className="size-4" aria-hidden="true" />
                  <h2 id="create-proposal-title" className="text-lg font-semibold">New proposal</h2>
                </div>
                <p className="mt-1 text-sm leading-5 text-editor-text-muted">Start from a blank document or duplicate an existing proposal.</p>
              </div>
              <EditorButton type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close new proposal dialog">
                <X className="size-5" aria-hidden="true" />
              </EditorButton>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-editor-text">Client</span>
                <div className="mt-1.5">
                  <EditorSegmentedControl
                    label="Client source"
                    value={clientMode}
                    onChange={setClientMode}
                    options={[
                      { value: "existing", label: "Existing" },
                      { value: "new", label: "New" },
                    ]}
                  />
                </div>
                {clientMode === "existing" ? (
                  <select
                    aria-label="Existing client"
                    className={`mt-2 ${inputClass}`}
                    value={existingClientId}
                    onChange={(event) => setExistingClientId(Number(event.target.value))}
                  >
                    {clients.length === 0 ? <option value={0}>No clients yet</option> : null}
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.fullName}</option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input aria-label="New client name" placeholder="Client full name" className={inputClass} value={newClientName} onChange={(event) => setNewClientName(event.target.value)} />
                    <input aria-label="New client email (optional)" placeholder="Email (optional)" className={inputClass} value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} />
                  </div>
                )}
              </div>

              <label className="block text-xs font-semibold text-editor-text">
                Trip name
                <input aria-label="Trip name" className={`mt-1.5 ${inputClass}`} value={tripName} onChange={(event) => setTripName(event.target.value)} placeholder="e.g. The Mainland Tour" />
              </label>

              <label className="block text-xs font-semibold text-editor-text">
                Document design
                <select aria-label="Document design" className={`mt-1.5 ${inputClass}`} value={designChoice} onChange={(event) => setDesignChoice(event.target.value)}>
                  {designs.map((design) => (
                    <option key={`${design.id}:${design.version}`} value={`${design.id}:${design.version}`}>
                      {design.name}{design.status === "preview" ? " (preview)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-xs font-semibold text-editor-text">Start from</span>
                <div className="mt-1.5">
                  <EditorSegmentedControl
                    label="Proposal origin"
                    value={origin}
                    onChange={setOrigin}
                    options={[
                      { value: "blank", label: "Blank" },
                      { value: "duplicate", label: "Duplicate existing" },
                      { value: "template", label: "From template" },
                    ]}
                  />
                </div>
                {origin === "duplicate" ? (
                  <select
                    aria-label="Proposal to duplicate"
                    className={`mt-2 ${inputClass}`}
                    value={sourceProposalId}
                    onChange={(event) => setSourceProposalId(Number(event.target.value))}
                  >
                    {existingProposals.length === 0 ? <option value={0}>No proposals to duplicate</option> : null}
                    {existingProposals.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>{proposal.title}</option>
                    ))}
                  </select>
                ) : null}
                {origin === "template" ? (
                  <select
                    aria-label="Template"
                    className={`mt-2 ${inputClass}`}
                    value={templateId}
                    onChange={(event) => setTemplateId(Number(event.target.value))}
                  >
                    {templates.length === 0 ? <option value={0}>No templates yet</option> : null}
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.title}</option>
                    ))}
                  </select>
                ) : null}
              </div>

              {error ? <EditorNotice tone="danger" className="px-3 py-2 text-xs">{error}</EditorNotice> : null}
              <EditorButton type="button" variant="primary" className="w-full" disabled={loading} onClick={() => void submit()}>
                {loading ? "Creating…" : "Create proposal"}
              </EditorButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
