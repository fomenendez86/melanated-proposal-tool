"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  Maximize2,
  Minus,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FocusEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateProposalFields } from "@/app/proposals/[id]/editor/actions";
import type { ProposalSummary } from "@/lib/db/getProposalSummary";
import type {
  EditorSaveState,
  ProposalEditorFieldName,
  ProposalEditorPageConfig,
  ProposalEditorPageMap,
} from "@/lib/editor/proposalEditorTypes";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

interface ProposalEditorShellProps {
  proposal: ProposalSummary;
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
  editorPages: ProposalEditorPageMap;
}

interface PageNavigatorProps {
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
  selectedPage: ProposalPageMeta;
  filter: string;
  onFilterChange: (value: string) => void;
  onSelect: (page: ProposalPageMeta) => void;
  onClose?: () => void;
}

interface PropertiesPanelProps {
  instanceId: "desktop" | "drawer";
  selectedPage: ProposalPageMeta;
  pageCount: number;
  proposalId: number;
  editorConfig?: ProposalEditorPageConfig;
  onSaveStateChange: (state: EditorSaveState) => void;
  onClose?: () => void;
}

const STATUS_COPY: Record<ProposalSummary["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
};

const SAVE_COPY: Record<EditorSaveState, string> = {
  loaded: "Loaded",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const THUMBNAIL_SCALE = 48 / PAGE_WIDTH;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 0.95;
const ZOOM_STEP = 0.05;

type ViewMode = "continuous" | "single";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99b32] focus-visible:ring-offset-2";

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(3))));
}

function PageThumbnail({ page }: { page: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white" aria-hidden="true">
      <div
        className="origin-top-left"
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          transform: `scale(${THUMBNAIL_SCALE})`,
        }}
      >
        {page}
      </div>
    </div>
  );
}

function PageNavigator({
  pageMeta,
  pages,
  selectedPage,
  filter,
  onFilterChange,
  onSelect,
  onClose,
}: PageNavigatorProps) {
  const filteredPages = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return pageMeta;
    return pageMeta.filter((page) =>
      `${page.pageNumber} ${page.eyebrow} ${page.title} ${page.description}`
        .toLowerCase()
        .includes(query)
    );
  }, [filter, pageMeta]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f8f5]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#d8ddd9] px-4">
        <div className="flex items-center gap-2">
          <Layers3 className="size-4 text-[#38574b]" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#42584f]">Pages</span>
          <span className="rounded-full bg-[#e3e8e4] px-2 py-0.5 text-xs font-semibold text-[#52655d]">
            {pageMeta.length}
          </span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close page navigator"
            data-dialog-initial-focus
            className={`grid size-11 place-items-center rounded-lg text-[#52645c] hover:bg-[#e9ece9] ${focusRing}`}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="p-3">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-[#cfd6d1] bg-white px-3 text-[#687971] focus-within:border-[#638174] focus-within:ring-2 focus-within:ring-[#638174]/20">
          <Search className="size-4" aria-hidden="true" />
          <span className="sr-only">Search proposal pages</span>
          <input
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Find a page"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#293831] outline-none placeholder:text-[#829089]"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-3" aria-label="Proposal pages">
        {filteredPages.map((page) => {
          const active = page.id === selectedPage.id;
          return (
            <button
              key={page.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(page)}
              className={`flex min-h-20 w-full items-start gap-3 rounded-xl border p-2.5 text-left transition ${focusRing} ${
                active
                  ? "border-[#7f9e90] bg-white shadow-[0_5px_18px_rgba(29,52,44,0.09)]"
                  : "border-transparent hover:border-[#d5ddd8] hover:bg-white/80"
              }`}
            >
              <div className={`relative h-[62px] w-12 shrink-0 overflow-hidden rounded border bg-white ${active ? "border-[#577c6b]" : "border-[#cfd7d2]"}`}>
                <PageThumbnail page={pages[page.pageNumber - 1]} />
                <span className="absolute bottom-0 right-0 grid min-h-4 min-w-4 place-items-center rounded-tl bg-white/90 px-1 text-[10px] font-bold tabular-nums text-[#3f554b]">
                  {page.pageNumber}
                </span>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`truncate text-sm font-semibold ${active ? "text-[#173b30]" : "text-[#2f4139]"}`}>
                  {page.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#687971]">{page.description}</p>
                <p className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-[#60766b]">
                  {page.eyebrow}
                </p>
              </div>
            </button>
          );
        })}
        {filteredPages.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-[#687971]">No pages match that search.</div>
        ) : null}
      </nav>

      <div className="border-t border-[#d8ddd9] px-4 py-3 text-xs text-[#52645c]">
        {pageMeta.length} rendered pages
      </div>
    </div>
  );
}

function fieldValues(config: ProposalEditorPageConfig) {
  return Object.fromEntries(config.fields.map((field) => [field.name, field.value])) as Partial<
    Record<ProposalEditorFieldName, string>
  >;
}

function EditableFieldsForm({
  proposalId,
  config,
  instanceId,
  onSaveStateChange,
}: {
  proposalId: number;
  config: ProposalEditorPageConfig;
  instanceId: PropertiesPanelProps["instanceId"];
  onSaveStateChange: (state: EditorSaveState) => void;
}) {
  const router = useRouter();
  const initialValues = useMemo(() => fieldValues(config), [config]);
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProposalEditorFieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const requestNumberRef = useRef(0);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const valuesKey = JSON.stringify(values);
  const savedValuesKey = JSON.stringify(savedValues);
  const isDirty = valuesKey !== savedValuesKey;

  const saveDraft = useCallback(async (draft: typeof values) => {
    if (JSON.stringify(draft) === JSON.stringify(savedValues)) return;
    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const requestNumber = ++requestNumberRef.current;
    onSaveStateChange("saving");
    setFormError("");
    const result = await updateProposalFields(proposalId, {
      kind: config.kind,
      sourceSectionId: config.sourceSectionId,
      sourceRefId: config.sourceRefId,
      values: draft,
    });
    if (requestNumber !== requestNumberRef.current) return;

    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.formError ?? "Check the highlighted fields.");
      onSaveStateChange("error");
      return;
    }

    setFieldErrors({});
    setSavedValues(draft);
    onSaveStateChange("saved");
    router.refresh();
  }, [
    config.kind,
    config.sourceRefId,
    config.sourceSectionId,
    onSaveStateChange,
    proposalId,
    router,
    savedValues,
  ]);

  useEffect(() => {
    if (!isDirty || config.saveMode === "explicit") return;
    onSaveStateChange("dirty");
    autosaveTimeoutRef.current = window.setTimeout(() => void saveDraft(values), 800);
    return () => {
      if (autosaveTimeoutRef.current !== null) window.clearTimeout(autosaveTimeoutRef.current);
    };
  }, [config.saveMode, isDirty, onSaveStateChange, saveDraft, values, valuesKey]);

  function handleFormBlur(event: FocusEvent<HTMLFormElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    if (isDirty && config.saveMode !== "explicit") void saveDraft(values);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void saveDraft(values);
      }}
      onBlur={handleFormBlur}
    >
      <div>
        <h3 className="text-sm font-semibold text-[#294c3d]">{config.heading}</h3>
        <p className="mt-1 text-xs leading-4 text-[#64766e]">{config.description}</p>
      </div>

      {config.saveMode === "explicit" ? (
        <p className="rounded-lg border border-[#ead7a6] bg-[#fff9e9] px-3 py-2 text-xs leading-4 text-[#735a20]">
          Review the full collection, then use Save now. These changes are not autosaved.
        </p>
      ) : null}

      {config.fields.map((field) => {
        const error = fieldErrors[field.name];
        const controlClass = `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#263a31] outline-none transition placeholder:text-[#8b9892] focus:border-[#638174] focus:ring-2 focus:ring-[#638174]/20 ${
          error ? "border-[#b64b43]" : "border-[#cfd8d2]"
        }`;
        const commonProps = {
          id: `editor-${instanceId}-${config.pageId}-${field.name}`,
          name: field.name,
          value: values[field.name] ?? "",
          maxLength: field.maxLength,
          required: field.required,
          placeholder: field.placeholder,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `error-${instanceId}-${config.pageId}-${field.name}` : undefined,
          onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setValues((current) => ({ ...current, [field.name]: event.target.value }));
            setFieldErrors((current) => ({ ...current, [field.name]: undefined }));
            onSaveStateChange("dirty");
          },
          className: controlClass,
        };

        return (
          <div key={field.name}>
            <label htmlFor={commonProps.id} className="text-xs font-semibold text-[#435a50]">
              {field.label}{field.required ? <span className="text-[#9b3f38]"> *</span> : null}
            </label>
            {field.multiline ? (
              <textarea {...commonProps} rows={config.saveMode === "explicit" ? 10 : 3} />
            ) : (
              <input {...commonProps} type="text" />
            )}
            <div className="mt-1 flex items-start justify-between gap-2 text-[11px]">
              <span id={error ? commonProps["aria-describedby"] : undefined} className={error ? "text-[#a13f38]" : "text-[#718179]"}>
                {error ?? field.helpText ?? ""}
              </span>
              <span className="shrink-0 tabular-nums text-[#87938d]">
                {(values[field.name] ?? "").length}/{field.maxLength}
              </span>
            </div>
          </div>
        );
      })}

      {formError ? (
        <p role="alert" className="rounded-lg border border-[#e0aaa5] bg-[#fff3f1] px-3 py-2 text-xs text-[#8d342e]">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!isDirty}
        className={`h-11 w-full rounded-lg bg-[#173b32] px-4 text-sm font-semibold text-white transition hover:bg-[#204d41] disabled:cursor-not-allowed disabled:bg-[#cad2ce] disabled:text-[#68776f] ${focusRing}`}
      >
        {isDirty ? "Save now" : "Changes saved"}
      </button>
    </form>
  );
}

function PropertiesPanel({
  instanceId,
  selectedPage,
  pageCount,
  proposalId,
  editorConfig,
  onSaveStateChange,
  onClose,
}: PropertiesPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfbf8]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#d8ddd9] px-4">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-[#38574b]" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#42584f]">Properties</span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close properties"
            data-dialog-initial-focus
            className={`grid size-11 place-items-center rounded-lg text-[#52645c] hover:bg-[#e9ece9] ${focusRing}`}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-[#e0e4e1] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#587066]">{selectedPage.eyebrow}</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#20332b]">{selectedPage.title}</h2>
          <p className="mt-2 text-sm leading-5 text-[#596b63]">{selectedPage.description}</p>
        </div>

        <div className="space-y-6 p-5">
          {editorConfig ? (
            <EditableFieldsForm
              key={editorConfig.pageId}
              proposalId={proposalId}
              config={editorConfig}
              instanceId={instanceId}
              onSaveStateChange={onSaveStateChange}
            />
          ) : (
            <section className="rounded-xl border border-[#d9dfdb] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#294c3d]">Preview only</h3>
              <p className="mt-1.5 text-sm leading-5 text-[#607168]">
                Editing for this content type will be enabled after proposal-specific catalog overrides are added.
              </p>
            </section>
          )}

          <section aria-labelledby={`page-information-heading-${instanceId}`}>
            <h3 id={`page-information-heading-${instanceId}`} className="text-xs font-bold uppercase tracking-[0.12em] text-[#587066]">
              Page information
            </h3>
            <dl className="mt-3 divide-y divide-[#e4e8e5] rounded-xl border border-[#d9dfdb] bg-white px-3.5">
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#5f7068]">Page</dt>
                <dd className="font-semibold tabular-nums text-[#2d4439]">{selectedPage.pageNumber} of {pageCount}</dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#5f7068]">Block type</dt>
                <dd className="max-w-[145px] truncate font-mono text-xs text-[#2d4439]">{selectedPage.type}</dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#5f7068]">Preview</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-[#356d54]">
                  <Check className="size-4" aria-hidden="true" /> Rendered
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby={`layout-heading-${instanceId}`} className="rounded-xl border border-[#d9e1dc] bg-[#f1f6f2] p-4">
            <h3 id={`layout-heading-${instanceId}`} className="text-sm font-semibold text-[#294c3d]">Print-safe layout</h3>
            <p className="mt-1.5 text-sm leading-5 text-[#526c60]">
              Spacing and page geometry are kept consistent automatically so the proposal remains ready for print.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function useFitCanvas(
  viewportRef: RefObject<HTMLDivElement | null>,
  setZoom: (value: number) => void,
  viewMode: ViewMode
) {
  const fitCanvas = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const horizontalPadding = viewport.clientWidth < 640 ? 32 : 72;
    const verticalPadding = viewport.clientHeight < 720 ? 32 : 64;
    const widthScale = (viewport.clientWidth - horizontalPadding) / PAGE_WIDTH;
    const heightScale = (viewport.clientHeight - verticalPadding) / PAGE_HEIGHT;
    const fittedScale = viewMode === "continuous" ? widthScale : Math.min(widthScale, heightScale);
    setZoom(clampZoom(Math.min(fittedScale, MAX_ZOOM)));
  }, [setZoom, viewportRef, viewMode]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(fitCanvas);
    observer.observe(viewport);
    fitCanvas();
    return () => observer.disconnect();
  }, [fitCanvas, viewportRef]);

  return fitCanvas;
}

export default function ProposalEditorShell({ proposal, pageMeta, pages, editorPages }: ProposalEditorShellProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(0.65);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [filter, setFilter] = useState("");
  const [pagesOpen, setPagesOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [saveState, setSaveState] = useState<EditorSaveState>("loaded");
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const pagesDialogRef = useRef<HTMLDivElement>(null);
  const propertiesDialogRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewModeTargetRef = useRef(0);

  const effectiveSelectedIndex = Math.min(selectedIndex, Math.max(0, pageMeta.length - 1));
  const selectedPage = pageMeta[effectiveSelectedIndex];
  const editorConfig = editorPages[selectedPage.id];
  const fitCanvas = useFitCanvas(canvasViewportRef, setZoom, viewMode);

  const confirmDiscardDraft = useCallback(() => {
    if (saveState !== "dirty" && saveState !== "error") return true;
    const confirmed = window.confirm("Discard the unsaved changes on this page?");
    if (confirmed) setSaveState("loaded");
    return confirmed;
  }, [saveState]);

  const navigateToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const nextIndex = Math.min(pageMeta.length - 1, Math.max(0, index));
    if (nextIndex !== selectedIndex && !confirmDiscardDraft()) return;
    setSelectedIndex(nextIndex);

    if (viewMode === "continuous") {
      pageRefs.current[nextIndex]?.scrollIntoView({ behavior, block: "start" });
    }
  }, [confirmDiscardDraft, pageMeta.length, selectedIndex, viewMode]);

  const selectPage = useCallback((page: ProposalPageMeta) => {
    const index = pageMeta.findIndex((candidate) => candidate.id === page.id);
    if (index >= 0) {
      navigateToIndex(index);
      setPagesOpen(false);
    }
  }, [navigateToIndex, pageMeta]);

  const moveSelection = useCallback((direction: -1 | 1) => {
    navigateToIndex(effectiveSelectedIndex + direction);
  }, [effectiveSelectedIndex, navigateToIndex]);

  const changeViewMode = useCallback((mode: ViewMode) => {
    viewModeTargetRef.current = effectiveSelectedIndex;
    setViewMode(mode);
  }, [effectiveSelectedIndex]);

  useEffect(() => {
    if (viewMode !== "continuous") return;

    const targetIndex = viewModeTargetRef.current;
    const timeout = window.setTimeout(() => {
      setSelectedIndex(targetIndex);
      pageRefs.current[targetIndex]?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 50);
    return () => window.clearTimeout(timeout);
  }, [viewMode]);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (viewMode !== "continuous" || !viewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const viewportCenter = viewport.getBoundingClientRect().top + viewport.clientHeight / 2;
            const aDistance = Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - viewportCenter);
            const bDistance = Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - viewportCenter);
            return aDistance - bDistance;
          })[0];
        const index = Number((visibleEntry?.target as HTMLElement | undefined)?.dataset.pageIndex);
        if (Number.isInteger(index) && saveState !== "dirty" && saveState !== "error") {
          setSelectedIndex(index);
        }
      },
      { root: viewport, rootMargin: "-42% 0px -42% 0px" }
    );

    pageRefs.current.forEach((page) => {
      if (page) observer.observe(page);
    });
    return () => observer.disconnect();
  }, [pageMeta.length, saveState, viewMode]);

  const closeProperties = useCallback(() => {
    if (confirmDiscardDraft()) setPropertiesOpen(false);
  }, [confirmDiscardDraft]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (saveState !== "dirty" && saveState !== "saving") return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "PageUp") {
        event.preventDefault();
        moveSelection(-1);
      }
      if (event.key === "PageDown") {
        event.preventDefault();
        moveSelection(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveSelection]);

  useEffect(() => {
    const dialog = pagesOpen ? pagesDialogRef.current : propertiesOpen ? propertiesDialogRef.current : null;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute("aria-hidden")
      );

    const initialFocus = dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]");
    initialFocus?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (pagesOpen) setPagesOpen(false);
        if (propertiesOpen) closeProperties();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      previousFocus?.focus();
    };
  }, [closeProperties, pagesOpen, propertiesOpen]);

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#edece7] text-[#17231f]">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#d3d9d5] bg-[#fbfbf8] px-4 shadow-[0_1px_0_rgba(23,35,31,0.04)] lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#173b32] text-[#f6c85f]" role="img" aria-label="Melanated Safaris Proposal Studio">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-[#17231f] sm:text-base">{proposal.title}</h1>
              <span className="hidden rounded-full bg-[#f1ead8] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#725b25] md:inline-flex">
                {STATUS_COPY[proposal.status]}
              </span>
            </div>
            <p className="truncate text-xs text-[#53665d]">{proposal.proposalNumber} · {proposal.clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-1.5 text-sm text-[#4d6c5d] lg:flex">
            {saveState === "saving" ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-[#9baaa2] border-t-[#315b49]" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            <span aria-live="polite">{SAVE_COPY[saveState]}</span>
          </div>
          <Link
            href={`/proposals/${proposal.id}/preview`}
            target="_blank"
            className={`inline-flex h-11 items-center gap-2 rounded-xl border border-[#bdc8c2] bg-white px-3.5 text-sm font-semibold text-[#263c32] transition hover:border-[#789084] hover:bg-[#f4f7f4] ${focusRing}`}
          >
            <Eye className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Client preview</span>
            <span className="sr-only sm:hidden">Open client preview</span>
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[252px_minmax(0,1fr)_304px]">
        <aside className="hidden min-h-0 border-r border-[#d3d9d5] lg:block">
          <PageNavigator
            pageMeta={pageMeta}
            pages={pages}
            selectedPage={selectedPage}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={selectPage}
          />
        </aside>

        <section className="relative flex min-h-0 min-w-0 flex-col bg-[#e9e8e3]" aria-label="Proposal canvas">
          <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-[#d0d6d2] bg-[#f4f4f0]/95 px-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setPagesOpen(true)}
                aria-label="Open page navigator"
                className={`grid size-11 place-items-center rounded-lg border border-[#cbd3ce] bg-white text-[#3f574c] lg:hidden ${focusRing}`}
              >
                <Layers3 className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveSelection(-1)}
                disabled={effectiveSelectedIndex === 0}
                aria-label="Previous page"
                className={`grid size-11 place-items-center rounded-lg border border-[#cbd3ce] bg-white text-[#3f574c] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => moveSelection(1)}
                disabled={effectiveSelectedIndex === pageMeta.length - 1}
                aria-label="Next page"
                className={`grid size-11 place-items-center rounded-lg border border-[#cbd3ce] bg-white text-[#3f574c] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
              <div className="ml-1 hidden min-w-0 text-sm xl:block">
                <span className="font-semibold text-[#2b4036]">{selectedPage.title}</span>
                <span className="ml-2 tabular-nums text-[#5d7067]">Page {selectedPage.pageNumber} of {pageMeta.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div
                className="hidden items-center rounded-xl border border-[#cbd3ce] bg-white p-0.5 shadow-sm md:flex"
                role="group"
                aria-label="Document view mode"
              >
                <button
                  type="button"
                  onClick={() => changeViewMode("continuous")}
                  aria-pressed={viewMode === "continuous"}
                  className={`h-10 rounded-lg px-3 text-xs font-semibold transition ${focusRing} ${
                    viewMode === "continuous"
                      ? "bg-[#173b32] text-white"
                      : "text-[#52665d] hover:bg-[#edf1ee]"
                  }`}
                >
                  Continuous
                </button>
                <button
                  type="button"
                  onClick={() => changeViewMode("single")}
                  aria-pressed={viewMode === "single"}
                  className={`h-10 rounded-lg px-3 text-xs font-semibold transition ${focusRing} ${
                    viewMode === "single"
                      ? "bg-[#173b32] text-white"
                      : "text-[#52665d] hover:bg-[#edf1ee]"
                  }`}
                >
                  Single page
                </button>
              </div>
              <div className="flex items-center rounded-xl border border-[#cbd3ce] bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
                  aria-label="Zoom out"
                  className={`grid size-10 place-items-center rounded-lg text-[#3f574c] hover:bg-[#edf1ee] ${focusRing}`}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="w-11 text-center text-xs font-semibold tabular-nums text-[#3f574c]" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
                  aria-label="Zoom in"
                  className={`grid size-10 place-items-center rounded-lg text-[#3f574c] hover:bg-[#edf1ee] ${focusRing}`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={fitCanvas}
                aria-label={viewMode === "continuous" ? "Fit pages to available width" : "Fit page to available space"}
                title={viewMode === "continuous" ? "Fit width" : "Fit page"}
                className={`grid size-11 place-items-center rounded-xl border border-[#cbd3ce] bg-white text-[#3f574c] hover:bg-[#edf1ee] ${focusRing}`}
              >
                <Maximize2 className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setPropertiesOpen(true)}
                aria-label="Open page properties"
                className={`grid size-11 place-items-center rounded-xl border border-[#cbd3ce] bg-white text-[#3f574c] xl:hidden ${focusRing}`}
              >
                <Settings2 className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div ref={canvasViewportRef} className="min-h-0 flex-1 overflow-auto">
            {viewMode === "continuous" ? (
              <div className="flex min-h-full min-w-full flex-col items-center gap-4 p-4 sm:gap-7 sm:p-8">
                {pages.map((page, index) => (
                  <div
                    key={pageMeta[index].id}
                    ref={(element) => { pageRefs.current[index] = element; }}
                    data-page-index={index}
                    aria-label={`Page ${index + 1}: ${pageMeta[index].title}`}
                    className={`relative shrink-0 bg-white shadow-[0_18px_55px_rgba(32,42,38,0.22)] ring-1 transition-shadow ${
                      effectiveSelectedIndex === index ? "ring-[#789084] ring-offset-2 ring-offset-[#e9e8e3]" : "ring-black/5"
                    }`}
                    style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}
                  >
                    <div
                      className="absolute left-0 top-0 origin-top-left bg-white"
                      style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${zoom})` }}
                    >
                      {page}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-full min-w-full items-start justify-center p-4 sm:p-8">
                <div
                  className="relative shrink-0 bg-white shadow-[0_18px_55px_rgba(32,42,38,0.22)] ring-1 ring-black/5"
                  style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}
                >
                  <div
                    className="absolute left-0 top-0 origin-top-left bg-white"
                    style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${zoom})` }}
                  >
                    {pages[effectiveSelectedIndex]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden min-h-0 border-l border-[#d3d9d5] xl:block">
          <PropertiesPanel
            instanceId="desktop"
            selectedPage={selectedPage}
            pageCount={pageMeta.length}
            proposalId={proposal.id}
            editorConfig={editorConfig}
            onSaveStateChange={setSaveState}
          />
        </aside>
      </div>

      <footer className="hidden h-9 shrink-0 items-center justify-between border-t border-[#d0d6d2] bg-[#f8f8f5] px-4 text-xs text-[#52645c] sm:flex">
        <div className="flex items-center gap-3">
          <span>{pageMeta.length} pages</span>
          <span className="size-1 rounded-full bg-[#aeb9b3]" aria-hidden="true" />
          <span>{proposal.travelDates}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 ${saveState === "error" ? "text-[#9b3f38]" : "text-[#3d6b55]"}`}>
          <Check className="size-3.5" aria-hidden="true" /> {SAVE_COPY[saveState]}
        </span>
      </footer>

      {pagesOpen ? (
        <div ref={pagesDialogRef} className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Page navigator">
          <button type="button" tabIndex={-1} aria-label="Close page navigator" onClick={() => setPagesOpen(false)} className="absolute inset-0 bg-[#10251e]/45" />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,340px)] border-r border-[#cbd3ce] shadow-2xl">
            <PageNavigator
              pageMeta={pageMeta}
              pages={pages}
              selectedPage={selectedPage}
              filter={filter}
              onFilterChange={setFilter}
              onSelect={selectPage}
              onClose={() => setPagesOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {propertiesOpen ? (
        <div ref={propertiesDialogRef} className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Page properties">
          <button type="button" tabIndex={-1} aria-label="Close properties" onClick={closeProperties} className="absolute inset-0 bg-[#10251e]/45" />
          <aside className="absolute inset-y-0 right-0 w-[min(90vw,360px)] border-l border-[#cbd3ce] shadow-2xl">
            <PropertiesPanel
              instanceId="drawer"
              selectedPage={selectedPage}
              pageCount={pageMeta.length}
              proposalId={proposal.id}
              editorConfig={editorConfig}
              onSaveStateChange={setSaveState}
              onClose={closeProperties}
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
}
