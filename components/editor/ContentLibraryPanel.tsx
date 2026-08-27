"use client";

import {
  Bookmark,
  Check,
  FileText,
  DotsSixVertical,
  Image as ImageIcon,
  Plus,
  MagnifyingGlass,
  Tag,
  Trash,
  Wallet,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  archiveLibraryFee,
  archiveLibraryImage,
  archiveLibrarySection,
  archiveLibrarySnippet,
  createLibrarySnippet,
  insertLibrarySection,
  saveLibraryFee,
} from "@/app/proposals/[id]/editor/libraryActions";
import type { ProposalDesignContext } from "@/lib/designs/types";
import type { ContentLibraryData, LibraryFeeItem, LibraryFeeUnit, LibraryImageItem } from "@/lib/library/types";

import { EditorButton, EditorEmptyState, EditorNotice, EditorSegmentedControl, editorFocusRing } from "./EditorUi";
import type { CatalogDragItem } from "./useCatalogDragInsert";

type LibraryMode = "sections" | "snippets" | "images" | "fees";

const controlClass = `h-11 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm text-editor-text outline-none transition placeholder:text-editor-text-subtle focus:border-editor-border-strong focus:ring-2 focus:ring-editor-border-strong/20 ${editorFocusRing}`;
const areaClass = `${controlClass} h-auto py-2.5`;

function tagList(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
}

export default function ContentLibraryPanel({
  proposalId,
  library,
  designContext,
  enableDrag,
  onDragStart,
  onImageUploaded,
  onImageArchived,
}: {
  proposalId: number;
  library: ContentLibraryData;
  designContext: ProposalDesignContext;
  enableDrag?: boolean;
  onDragStart?: (item: CatalogDragItem, event: React.PointerEvent) => void;
  onImageUploaded?: (item: LibraryImageItem) => void;
  onImageArchived?: (id: number) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<LibraryMode>("sections");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [snippet, setSnippet] = useState({ name: "", body: "", tags: "" });
  const [image, setImage] = useState({ name: "", tags: "" });
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [fee, setFee] = useState({ name: "", description: "", price: "", currency: "USD", unit: "flat" as LibraryFeeUnit, tax: "0" });

  const normalized = query.trim().toLowerCase();
  const matches = (values: Array<string | null | undefined>) => !normalized || values.join(" ").toLowerCase().includes(normalized);
  const sections = library.sections.filter((item) => matches([item.name, item.description, item.sectionType, ...item.tags]));
  const snippets = library.snippets.filter((item) => matches([item.name, item.body, ...item.tags]));
  const images = library.images.filter((item) => matches([item.name, item.originalName, ...item.tags]));
  const fees = library.fees.filter((item) => matches([item.name, item.description, item.currency, item.unit]));

  async function run(key: string, action: () => Promise<{ ok: boolean; formError?: string }>, success: string) {
    setPending(key);
    setError("");
    setNotice("");
    const result = await action();
    setPending("");
    if (!result.ok) {
      setError(result.formError ?? "The library could not be updated.");
      return false;
    }
    setNotice(success);
    router.refresh();
    return true;
  }

  function editFee(item: LibraryFeeItem) {
    setEditingFeeId(item.id);
    setFee({
      name: item.name,
      description: item.description ?? "",
      price: (item.unitPriceMinor / 100).toFixed(2),
      currency: item.currency,
      unit: item.unit,
      tax: (item.taxRateBps / 100).toFixed(2),
    });
  }

  return (
    <div>
      <EditorSegmentedControl
        label="Library content type"
        value={mode}
        options={[
          { value: "sections", label: "Sections" },
          { value: "snippets", label: "Text" },
          { value: "images", label: "Images" },
          { value: "fees", label: "Fees" },
        ]}
        onChange={(value) => { setMode(value); setError(""); setNotice(""); }}
        className="grid w-full grid-cols-2 [&>button]:w-full"
      />
      <label className="mt-3 flex h-11 items-center gap-2 rounded-editor-md border border-editor-border bg-editor-raised px-3 text-editor-text-muted focus-within:border-editor-border-strong focus-within:ring-2 focus-within:ring-editor-border-strong/20">
        <MagnifyingGlass className="size-4" aria-hidden="true" />
        <span className="sr-only">Search library</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${mode}`} className="min-w-0 flex-1 bg-transparent text-sm text-editor-text-strong outline-none" />
      </label>

      {error ? <EditorNotice tone="danger" className="mt-3 px-3 py-2 text-xs">{error}</EditorNotice> : null}
      {notice ? <EditorNotice tone="success" className="mt-3 px-3 py-2 text-xs">{notice}</EditorNotice> : null}

      {mode === "snippets" ? (
        <div className="mt-4 space-y-2 rounded-editor-lg border border-editor-border-subtle bg-editor-inset p-3">
          <h3 className="text-sm font-semibold text-editor-text">New text snippet</h3>
          <input aria-label="Snippet name" value={snippet.name} onChange={(event) => setSnippet((current) => ({ ...current, name: event.target.value }))} className={controlClass} placeholder="Snippet name" />
          <textarea aria-label="Snippet text" value={snippet.body} onChange={(event) => setSnippet((current) => ({ ...current, body: event.target.value }))} className={areaClass} rows={4} placeholder="Reusable paragraph" />
          <input aria-label="Snippet tags" value={snippet.tags} onChange={(event) => setSnippet((current) => ({ ...current, tags: event.target.value }))} className={controlClass} placeholder="Tags, separated by commas" />
          <EditorButton type="button" variant="primary" className="w-full" disabled={pending === "snippet-create"} onClick={async () => {
            if (await run("snippet-create", () => createLibrarySnippet(proposalId, { name: snippet.name, body: snippet.body, tags: tagList(snippet.tags) }), "Snippet saved.")) setSnippet({ name: "", body: "", tags: "" });
          }}><Plus className="size-4" /> Save snippet</EditorButton>
        </div>
      ) : null}

      {mode === "images" ? (
        <div className="mt-4 space-y-2 rounded-editor-lg border border-editor-border-subtle bg-editor-inset p-3">
          <h3 className="text-sm font-semibold text-editor-text">Upload image</h3>
          <input ref={fileRef} aria-label="Image file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="block w-full text-xs text-editor-text-muted file:mr-2 file:rounded-editor-md file:border-0 file:bg-editor-raised file:px-3 file:py-2 file:font-semibold" />
          <input aria-label="Image name" value={image.name} onChange={(event) => setImage((current) => ({ ...current, name: event.target.value }))} className={controlClass} placeholder="Image name" />
          <input aria-label="Image tags" value={image.tags} onChange={(event) => setImage((current) => ({ ...current, tags: event.target.value }))} className={controlClass} placeholder="Tags, separated by commas" />
          <EditorButton type="button" variant="primary" className="w-full" disabled={pending === "image-upload"} onClick={async () => {
            const file = fileRef.current?.files?.[0];
            if (!file) { setError("Choose an image file."); return; }
            setPending("image-upload"); setError(""); setNotice("");
            const body = new FormData();
            body.set("file", file); body.set("name", image.name); body.set("tags", image.tags); body.set("proposalId", String(proposalId));
            const response = await fetch("/api/library/images", { method: "POST", body });
            const result = await response.json() as { ok: boolean; id?: number; url?: string; error?: string };
            setPending("");
            if (!result.ok || !result.id || !result.url) { setError(result.error ?? "The image could not be uploaded."); return; }
            onImageUploaded?.({ id: result.id, name: image.name, originalName: file.name || image.name, url: result.url, mimeType: file.type, sizeBytes: file.size, tags: tagList(image.tags) });
            setNotice("Image uploaded."); setImage({ name: "", tags: "" }); if (fileRef.current) fileRef.current.value = ""; router.refresh();
          }}><Plus className="size-4" /> Upload image</EditorButton>
        </div>
      ) : null}

      {mode === "fees" ? (
        <div className="mt-4 space-y-2 rounded-editor-lg border border-editor-border-subtle bg-editor-inset p-3">
          <h3 className="text-sm font-semibold text-editor-text">{editingFeeId ? "Update fee" : "New reusable fee"}</h3>
          <input aria-label="Fee name" value={fee.name} onChange={(event) => setFee((current) => ({ ...current, name: event.target.value }))} className={controlClass} placeholder="Fee name" />
          <textarea aria-label="Fee description" value={fee.description} onChange={(event) => setFee((current) => ({ ...current, description: event.target.value }))} className={areaClass} rows={2} placeholder="Description" />
          <div className="grid grid-cols-2 gap-2"><input aria-label="Unit price" type="number" min="0" step="0.01" value={fee.price} onChange={(event) => setFee((current) => ({ ...current, price: event.target.value }))} className={controlClass} placeholder="0.00" /><input aria-label="Fee currency" value={fee.currency} maxLength={3} onChange={(event) => setFee((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} className={controlClass} /></div>
          <div className="grid grid-cols-2 gap-2"><select aria-label="Fee unit" value={fee.unit} onChange={(event) => setFee((current) => ({ ...current, unit: event.target.value as LibraryFeeUnit }))} className={controlClass}><option value="flat">Flat</option><option value="per_person">Per person</option><option value="per_night">Per night</option><option value="per_vehicle">Per vehicle</option></select><input aria-label="Tax percent" type="number" min="0" max="100" step="0.01" value={fee.tax} onChange={(event) => setFee((current) => ({ ...current, tax: event.target.value }))} className={controlClass} placeholder="Tax %" /></div>
          <div className="flex gap-2">{editingFeeId ? <EditorButton type="button" variant="ghost" className="flex-1" onClick={() => { setEditingFeeId(null); setFee({ name: "", description: "", price: "", currency: "USD", unit: "flat", tax: "0" }); }}>Cancel</EditorButton> : null}<EditorButton type="button" variant="primary" className="flex-1" disabled={pending === "fee-save"} onClick={async () => {
            const price = Number(fee.price); const tax = Number(fee.tax);
            if (await run("fee-save", () => saveLibraryFee(proposalId, editingFeeId, { name: fee.name, description: fee.description, unitPriceMinor: Math.round(price * 100), currency: fee.currency, unit: fee.unit, taxRateBps: Math.round(tax * 100) }), editingFeeId ? "Fee updated." : "Fee saved.")) { setEditingFeeId(null); setFee({ name: "", description: "", price: "", currency: "USD", unit: "flat", tax: "0" }); }
          }}><Plus className="size-4" /> {editingFeeId ? "Update" : "Save fee"}</EditorButton></div>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {mode === "sections" ? sections.map((item) => {
          const supported = designContext.active.supportedSectionTypes.includes(item.sectionType);
          return <article key={item.id} className="rounded-editor-lg border border-editor-border-subtle bg-editor-raised p-3.5">
            <div className="flex items-start gap-2.5">
              {enableDrag && supported ? <button type="button" onPointerDown={(event) => onDragStart?.({ kind: "savedSection", id: item.id, label: item.name }, event)} aria-label={`Drag saved section ${item.name} to a position in the document`} className={`grid size-8 shrink-0 cursor-grab place-items-center rounded-editor-sm text-editor-text-subtle hover:bg-editor-inset ${editorFocusRing}`}><DotsSixVertical className="size-4" /></button> : null}
              <Bookmark className="mt-1 size-4 shrink-0 text-editor-brand" />
              <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-editor-text">{item.name}</h3><p className="font-mono text-[10px] text-editor-text-muted">{item.sectionType}</p></div>
            </div>
            {item.description ? <p className="mt-2 text-xs text-editor-text-muted">{item.description}</p> : null}
            {item.tags.length ? <p className="mt-2 flex items-center gap-1 text-[11px] text-editor-text-subtle"><Tag className="size-3" />{item.tags.join(" · ")}</p> : null}
            {!supported ? <p className="mt-2 text-xs text-editor-warning">Not supported by {designContext.active.name}.</p> : null}
            <div className="mt-3 flex gap-2"><EditorButton type="button" size="sm" variant="primary" className="flex-1" disabled={!supported || pending === `section-${item.id}`} onClick={() => void run(`section-${item.id}`, () => insertLibrarySection(proposalId, item.id), "Saved section inserted.")}><Check className="size-4" /> Insert</EditorButton><EditorButton type="button" size="icon" variant="ghost" className="size-11 text-editor-danger" aria-label={`Archive saved section ${item.name}`} onClick={() => void run(`archive-section-${item.id}`, () => archiveLibrarySection(proposalId, item.id), "Saved section archived.")}><Trash className="size-4" /></EditorButton></div>
          </article>;
        }) : null}

        {mode === "snippets" ? snippets.map((item) => <article key={item.id} className="rounded-editor-lg border border-editor-border-subtle bg-editor-raised p-3.5"><div className="flex items-start gap-2"><FileText className="mt-0.5 size-4 text-editor-brand" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-editor-text">{item.name}</h3><p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-editor-text-muted">{item.body}</p></div><EditorButton type="button" size="icon" variant="ghost" className="size-9 text-editor-danger" aria-label={`Archive snippet ${item.name}`} onClick={() => void run(`archive-snippet-${item.id}`, () => archiveLibrarySnippet(proposalId, item.id), "Snippet archived.")}><Trash className="size-4" /></EditorButton></div></article>) : null}

        {mode === "images" ? images.map((item) => <article key={item.id} className="overflow-hidden rounded-editor-lg border border-editor-border-subtle bg-editor-raised"><div className="h-32 bg-editor-inset">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
        </div><div className="flex items-start gap-2 p-3"><ImageIcon className="mt-0.5 size-4 text-editor-brand" /><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-editor-text">{item.name}</h3><p className="text-[11px] text-editor-text-muted">{Math.ceil(item.sizeBytes / 1024)} KB · {item.mimeType}</p></div><EditorButton type="button" size="icon" variant="ghost" className="size-9 text-editor-danger" aria-label={`Archive image ${item.name}`} onClick={async () => { if (await run(`archive-image-${item.id}`, () => archiveLibraryImage(proposalId, item.id), "Image archived; existing proposals remain intact.")) onImageArchived?.(item.id); }}><Trash className="size-4" /></EditorButton></div></article>) : null}

        {mode === "fees" ? fees.map((item) => <article key={item.id} className="rounded-editor-lg border border-editor-border-subtle bg-editor-raised p-3.5"><div className="flex items-start gap-2"><Wallet className="mt-0.5 size-4 text-editor-brand" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-editor-text">{item.name}</h3><p className="mt-1 text-xs text-editor-text-muted">{money(item.unitPriceMinor, item.currency)} · {item.unit.replaceAll("_", " ")} · {(item.taxRateBps / 100).toFixed(2)}% tax</p>{item.description ? <p className="mt-1 text-xs text-editor-text-muted">{item.description}</p> : null}</div></div><div className="mt-2 flex gap-2"><EditorButton type="button" size="sm" variant="secondary" className="flex-1" onClick={() => editFee(item)}>Edit</EditorButton><EditorButton type="button" size="icon" variant="ghost" className="size-11 text-editor-danger" aria-label={`Archive fee ${item.name}`} onClick={() => void run(`archive-fee-${item.id}`, () => archiveLibraryFee(proposalId, item.id), "Fee archived.")}><Trash className="size-4" /></EditorButton></div></article>) : null}

        {(mode === "sections" ? sections.length : mode === "snippets" ? snippets.length : mode === "images" ? images.length : fees.length) === 0 ? <EditorEmptyState compact icon={mode === "sections" ? <Bookmark className="size-5" /> : mode === "snippets" ? <FileText className="size-5" /> : mode === "images" ? <ImageIcon className="size-5" /> : <Wallet className="size-5" />} title={`No ${mode} yet`} description={normalized ? "Adjust the search or create a new library item." : "Create the first reusable item for future proposals."} /> : null}
      </div>
    </div>
  );
}
