"use client";

import {
  Check,
  CircleAlert,
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FocusEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateProposalFields } from "@/app/proposals/[id]/editor/actions";
import { updateProposalDesign } from "@/app/proposals/[id]/editor/designActions";
import type { ProposalSummary } from "@/lib/db/getProposalSummary";
import type { DocumentPageGeometry, ProposalDesignContext } from "@/lib/designs/types";
import type {
  EditorSaveState,
  ProposalEditorFieldName,
  ProposalEditorPageConfig,
  ProposalEditorPageMap,
} from "@/lib/editor/proposalEditorTypes";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

import {
  EditorButton,
  EditorDrawer,
  EditorEmptyState,
  EditorField,
  EditorInspectorSection,
  EditorNotice,
  EditorPageCard,
  EditorPanelHeader,
  EditorSegmentedControl,
  EditorStatusBadge,
  editorButtonStyles,
  editorFocusRing,
} from "./EditorUi";

interface ProposalEditorShellProps {
  proposal: ProposalSummary;
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
  editorPages: ProposalEditorPageMap;
  designContext: ProposalDesignContext;
}

interface PageNavigatorProps {
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
  selectedPage: ProposalPageMeta;
  filter: string;
  onFilterChange: (value: string) => void;
  onSelect: (page: ProposalPageMeta) => void;
  pageSize: DocumentPageGeometry;
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

const STATUS_TONE: Record<ProposalSummary["status"], "neutral" | "warning" | "success" | "danger"> = {
  draft: "warning",
  sent: "neutral",
  accepted: "success",
  expired: "danger",
};

const SAVE_TONE: Record<EditorSaveState, "neutral" | "warning" | "success" | "danger"> = {
  loaded: "neutral",
  dirty: "warning",
  saving: "warning",
  saved: "success",
  error: "danger",
};

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 0.95;
const ZOOM_STEP = 0.05;

type ViewMode = "continuous" | "single";

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(3))));
}

function PageThumbnail({ page, pageSize }: { page: ReactNode; pageSize: DocumentPageGeometry }) {
  const thumbnailScale = 48 / pageSize.widthPx;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white" aria-hidden="true">
      <div
        className="origin-top-left"
        style={{
          width: pageSize.widthPx,
          height: pageSize.heightPx,
          transform: `scale(${thumbnailScale})`,
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
  pageSize,
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
    <div className="flex h-full min-h-0 flex-col bg-editor-panel-muted">
      <EditorPanelHeader
        icon={<Layers3 className="size-4" />}
        label="Pages"
        count={pageMeta.length}
        onClose={onClose}
        closeLabel="Close page navigator"
      />

      <div className="p-3">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-editor-border bg-editor-raised px-3 text-editor-text-muted focus-within:border-editor-border-strong focus-within:ring-2 focus-within:ring-editor-border-strong/20">
          <Search className="size-4" aria-hidden="true" />
          <span className="sr-only">Search proposal pages</span>
          <input
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Find a page"
            className="min-w-0 flex-1 bg-transparent text-sm text-editor-text-strong outline-none placeholder:text-editor-text-subtle"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-3" aria-label="Proposal pages">
        {filteredPages.map((page) => {
          const active = page.id === selectedPage.id;
          return (
            <EditorPageCard
              key={page.id}
              active={active}
              pageNumber={page.pageNumber}
              title={page.title}
              description={page.description}
              eyebrow={page.eyebrow}
              thumbnail={<PageThumbnail page={pages[page.pageNumber - 1]} pageSize={pageSize} />}
              thumbnailHeight={(48 * pageSize.heightPx) / pageSize.widthPx}
              onSelect={() => onSelect(page)}
            />
          );
        })}
        {filteredPages.length === 0 ? (
          <EditorEmptyState
            compact
            title="No matching pages"
            description="Try a page number, title, or section name."
            icon={<Search className="size-5" />}
          />
        ) : null}
      </nav>

      <div className="border-t border-editor-border-subtle px-4 py-3 text-xs text-editor-text-muted">
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
        <h3 className="text-sm font-semibold text-editor-brand">{config.heading}</h3>
        <p className="mt-1 text-xs leading-4 text-editor-text-muted">{config.description}</p>
      </div>

      {config.saveMode === "explicit" ? (
        <EditorNotice tone="warning" className="rounded-lg px-3 py-2 text-xs leading-4">
          Review the full collection, then use Save now. These changes are not autosaved.
        </EditorNotice>
      ) : null}

      {config.fields.map((field) => {
        const error = fieldErrors[field.name];
        return (
          <EditorField
            key={field.name}
            field={field}
            id={`editor-${instanceId}-${config.pageId}-${field.name}`}
            value={values[field.name] ?? ""}
            error={error}
            rows={config.saveMode === "explicit" ? 10 : 3}
            onChange={(event) => {
            setValues((current) => ({ ...current, [field.name]: event.target.value }));
            setFieldErrors((current) => ({ ...current, [field.name]: undefined }));
            onSaveStateChange("dirty");
            }}
          />
        );
      })}

      {formError ? (
        <div role="alert">
          <EditorNotice tone="danger" className="rounded-lg px-3 py-2 text-xs">{formError}</EditorNotice>
        </div>
      ) : null}

      <EditorButton
        type="submit"
        variant="primary"
        disabled={!isDirty}
        className="w-full rounded-lg"
      >
        {isDirty ? "Save now" : "Changes saved"}
      </EditorButton>
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
    <div className="flex h-full min-h-0 flex-col bg-editor-panel">
      <EditorPanelHeader
        icon={<Settings2 className="size-4" />}
        label="Properties"
        onClose={onClose}
        closeLabel="Close properties"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-editor-border-subtle p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-editor-text-muted">{selectedPage.eyebrow}</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-editor-text-strong">{selectedPage.title}</h2>
          <p className="mt-2 text-sm leading-5 text-editor-text-muted">{selectedPage.description}</p>
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
            <EditorEmptyState
              title="Preview only"
              description="This page is available for review but has no editable fields in the active document design."
              icon={<Eye className="size-5" />}
            />
          )}

          <EditorInspectorSection id={`page-information-heading-${instanceId}`} title="Page information">
            <dl className="divide-y divide-editor-border-subtle rounded-xl border border-editor-border-subtle bg-editor-raised px-3.5">
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-editor-text-muted">Page</dt>
                <dd className="font-semibold tabular-nums text-editor-text">{selectedPage.pageNumber} of {pageCount}</dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-editor-text-muted">Block type</dt>
                <dd className="max-w-[145px] truncate font-mono text-xs text-editor-text">{selectedPage.type}</dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-editor-text-muted">Preview</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-editor-success">
                  <Check className="size-4" aria-hidden="true" /> Rendered
                </dd>
              </div>
            </dl>
          </EditorInspectorSection>

          <EditorNotice tone="success" title="Print-safe layout">
            <p>
              Spacing and page geometry are kept consistent automatically so the proposal remains ready for print.
            </p>
          </EditorNotice>
        </div>
      </div>
    </div>
  );
}

function useFitCanvas(
  viewportRef: RefObject<HTMLDivElement | null>,
  setZoom: (value: number) => void,
  viewMode: ViewMode,
  pageSize: DocumentPageGeometry
) {
  const fitCanvas = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const horizontalPadding = viewport.clientWidth < 640 ? 32 : 72;
    const verticalPadding = viewport.clientHeight < 720 ? 32 : 64;
    const widthScale = (viewport.clientWidth - horizontalPadding) / pageSize.widthPx;
    const heightScale = (viewport.clientHeight - verticalPadding) / pageSize.heightPx;
    const fittedScale = viewMode === "continuous" ? widthScale : Math.min(widthScale, heightScale);
    setZoom(clampZoom(Math.min(fittedScale, MAX_ZOOM)));
  }, [pageSize.heightPx, pageSize.widthPx, setZoom, viewportRef, viewMode]);

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

export default function ProposalEditorShell({
  proposal,
  pageMeta,
  pages,
  editorPages,
  designContext,
}: ProposalEditorShellProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(0.65);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [filter, setFilter] = useState("");
  const [pagesOpen, setPagesOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [saveState, setSaveState] = useState<EditorSaveState>("loaded");
  const [designChanging, setDesignChanging] = useState(false);
  const [designError, setDesignError] = useState("");
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const pagesDialogRef = useRef<HTMLDivElement>(null);
  const propertiesDialogRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewModeTargetRef = useRef(0);

  const effectiveSelectedIndex = Math.min(selectedIndex, Math.max(0, pageMeta.length - 1));
  const selectedPage = pageMeta[effectiveSelectedIndex];
  const editorConfig = editorPages[selectedPage.id];
  const pageSize = designContext.active.page;
  const activeDesignKey = `${designContext.active.id}@${designContext.active.version}`;
  const fitCanvas = useFitCanvas(canvasViewportRef, setZoom, viewMode, pageSize);

  const confirmDiscardDraft = useCallback(() => {
    if (saveState !== "dirty" && saveState !== "error") return true;
    const confirmed = window.confirm("Discard the unsaved changes on this page?");
    if (confirmed) setSaveState("loaded");
    return confirmed;
  }, [saveState]);

  const changeDocumentDesign = useCallback(async (designKey: string) => {
    if (designKey === activeDesignKey || designChanging) return;
    const choice = designContext.choices.find(
      ({ design }) => `${design.id}@${design.version}` === designKey
    );
    if (!choice) {
      setDesignError("That document design is no longer available.");
      return;
    }
    if (!choice.compatible) {
      setDesignError(`This proposal contains unsupported sections: ${choice.unsupportedSectionTypes.join(", ")}.`);
      return;
    }
    if (!confirmDiscardDraft()) return;
    if (!window.confirm(`Switch this proposal to ${choice.design.name}? Your saved content will be kept.`)) return;

    setDesignChanging(true);
    setDesignError("");
    setSaveState("saving");
    const result = await updateProposalDesign(proposal.id, {
      designId: choice.design.id,
      version: choice.design.version,
    });
    setDesignChanging(false);

    if (!result.ok) {
      setDesignError(result.formError ?? "The document design could not be changed.");
      setSaveState("error");
      return;
    }

    setSaveState("saved");
    router.refresh();
  }, [activeDesignKey, confirmDiscardDraft, designChanging, designContext.choices, proposal.id, router]);

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
    <main className="proposal-studio flex h-dvh min-h-0 flex-col overflow-hidden bg-editor-shell text-editor-text-strong">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-editor-border-subtle bg-editor-panel px-4 shadow-editor-toolbar lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-editor-brand text-editor-accent" role="img" aria-label="Melanated Safaris Proposal Studio">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-editor-text-strong sm:text-base">{proposal.title}</h1>
              <EditorStatusBadge tone={STATUS_TONE[proposal.status]} className="hidden uppercase tracking-[0.1em] md:inline-flex">
                {STATUS_COPY[proposal.status]}
              </EditorStatusBadge>
            </div>
            <p className="truncate text-xs text-editor-text-muted">{proposal.proposalNumber} · {proposal.clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <label htmlFor="document-design" className="hidden text-xs font-semibold text-editor-text-muted lg:block">
              Design
            </label>
            <select
              id="document-design"
              value={activeDesignKey}
              disabled={designChanging}
              onChange={(event) => void changeDocumentDesign(event.target.value)}
              aria-describedby={designError ? "document-design-error" : undefined}
              className={`h-10 max-w-44 rounded-lg border border-editor-border bg-editor-raised px-2.5 text-xs font-semibold text-editor-text outline-none transition hover:border-editor-border-strong disabled:cursor-wait disabled:text-editor-disabled-text ${editorFocusRing}`}
            >
              {designContext.choices.map(({ design, compatible }) => (
                <option
                  key={`${design.id}@${design.version}`}
                  value={`${design.id}@${design.version}`}
                  disabled={!compatible}
                >
                  {design.name} · v{design.version}{design.status === "preview" ? " · Preview" : ""}{!compatible ? " · Incompatible" : ""}
                </option>
              ))}
            </select>
          </div>
          <EditorStatusBadge tone="neutral" className="sm:hidden">
            {designContext.active.name}
          </EditorStatusBadge>
          {designError ? (
            <EditorStatusBadge
              tone="danger"
              live
              className="hidden lg:inline-flex"
              icon={<CircleAlert className="size-3.5" />}
            >
              <span id="document-design-error" title={designError}>Design change failed</span>
            </EditorStatusBadge>
          ) : null}
          <EditorStatusBadge
            tone={SAVE_TONE[saveState]}
            live
            className="mr-1 hidden lg:inline-flex"
            icon={saveState === "saving"
              ? <span className="block size-3.5 animate-spin rounded-full border-2 border-editor-disabled-text border-t-editor-success" />
              : saveState === "error"
                ? <CircleAlert className="size-3.5" />
                : <Check className="size-3.5" />}
          >
            {SAVE_COPY[saveState]}
          </EditorStatusBadge>
          <Link
            href={`/proposals/${proposal.id}/preview`}
            target="_blank"
            className={editorButtonStyles()}
          >
            <Eye className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Client preview</span>
            <span className="sr-only sm:hidden">Open client preview</span>
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[252px_minmax(0,1fr)_304px]">
        <aside className="hidden min-h-0 border-r border-editor-border-subtle lg:block">
          <PageNavigator
            pageMeta={pageMeta}
            pages={pages}
            selectedPage={selectedPage}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={selectPage}
            pageSize={pageSize}
          />
        </aside>

        <section className="relative flex min-h-0 min-w-0 flex-col bg-editor-canvas" aria-label="Proposal canvas">
          <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-editor-border-subtle bg-editor-toolbar/95 px-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <EditorButton
                type="button"
                size="icon"
                onClick={() => setPagesOpen(true)}
                aria-label="Open page navigator"
                className="rounded-lg lg:hidden"
              >
                <Layers3 className="size-5" aria-hidden="true" />
              </EditorButton>
              <EditorButton
                type="button"
                size="icon"
                onClick={() => moveSelection(-1)}
                disabled={effectiveSelectedIndex === 0}
                aria-label="Previous page"
                className="rounded-lg disabled:opacity-35"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </EditorButton>
              <EditorButton
                type="button"
                size="icon"
                onClick={() => moveSelection(1)}
                disabled={effectiveSelectedIndex === pageMeta.length - 1}
                aria-label="Next page"
                className="rounded-lg disabled:opacity-35"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </EditorButton>
              <div className="ml-1 hidden min-w-0 text-sm xl:block">
                <span className="font-semibold text-editor-text">{selectedPage.title}</span>
                <span className="ml-2 tabular-nums text-editor-text-muted">Page {selectedPage.pageNumber} of {pageMeta.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <EditorSegmentedControl
                label="Document view mode"
                value={viewMode}
                options={[
                  { value: "continuous", label: "Continuous" },
                  { value: "single", label: "Single page" },
                ]}
                onChange={changeViewMode}
                className="hidden md:inline-flex"
              />
              <div className="flex items-center rounded-xl border border-editor-border bg-editor-raised p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
                  aria-label="Zoom out"
                  className={`grid size-10 place-items-center rounded-lg text-editor-text hover:bg-editor-inset ${editorFocusRing}`}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="w-11 text-center text-xs font-semibold tabular-nums text-editor-text" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
                  aria-label="Zoom in"
                  className={`grid size-10 place-items-center rounded-lg text-editor-text hover:bg-editor-inset ${editorFocusRing}`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
              <EditorButton
                type="button"
                size="icon"
                onClick={fitCanvas}
                aria-label={viewMode === "continuous" ? "Fit pages to available width" : "Fit page to available space"}
                title={viewMode === "continuous" ? "Fit width" : "Fit page"}
              >
                <Maximize2 className="size-4" aria-hidden="true" />
              </EditorButton>
              <EditorButton
                type="button"
                size="icon"
                onClick={() => setPropertiesOpen(true)}
                aria-label="Open page properties"
                className="xl:hidden"
              >
                <Settings2 className="size-5" aria-hidden="true" />
              </EditorButton>
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
                    className={`relative shrink-0 bg-white shadow-editor-page ring-1 transition-shadow ${
                      effectiveSelectedIndex === index ? "ring-editor-border-strong ring-offset-2 ring-offset-editor-canvas" : "ring-black/5"
                    }`}
                    style={{ width: pageSize.widthPx * zoom, height: pageSize.heightPx * zoom }}
                  >
                    <div
                      className="absolute left-0 top-0 origin-top-left bg-white"
                      style={{ width: pageSize.widthPx, height: pageSize.heightPx, transform: `scale(${zoom})` }}
                    >
                      {page}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-full min-w-full items-start justify-center p-4 sm:p-8">
                <div
                  className="relative shrink-0 bg-white shadow-editor-page ring-1 ring-black/5"
                  style={{ width: pageSize.widthPx * zoom, height: pageSize.heightPx * zoom }}
                >
                  <div
                    className="absolute left-0 top-0 origin-top-left bg-white"
                    style={{ width: pageSize.widthPx, height: pageSize.heightPx, transform: `scale(${zoom})` }}
                  >
                    {pages[effectiveSelectedIndex]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden min-h-0 border-l border-editor-border-subtle xl:block">
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

      <footer className="hidden h-9 shrink-0 items-center justify-between border-t border-editor-border-subtle bg-editor-panel-muted px-4 text-xs text-editor-text-muted sm:flex">
        <div className="flex items-center gap-3">
          <span>{pageMeta.length} pages</span>
          <span className="size-1 rounded-full bg-editor-border" aria-hidden="true" />
          <span>{proposal.travelDates}</span>
          <span className="size-1 rounded-full bg-editor-border" aria-hidden="true" />
          <span>{designContext.active.name} · {pageSize.formatLabel}</span>
        </div>
        <EditorStatusBadge
          tone={SAVE_TONE[saveState]}
          icon={saveState === "error" ? <CircleAlert className="size-3.5" /> : <Check className="size-3.5" />}
        >
          {SAVE_COPY[saveState]}
        </EditorStatusBadge>
      </footer>

      {pagesOpen ? (
        <EditorDrawer
          ref={pagesDialogRef}
          side="left"
          label="Page navigator"
          onClose={() => setPagesOpen(false)}
          className="lg:hidden"
          panelClassName="w-[min(88vw,340px)]"
        >
          <PageNavigator
            pageMeta={pageMeta}
            pages={pages}
            selectedPage={selectedPage}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={selectPage}
            pageSize={pageSize}
            onClose={() => setPagesOpen(false)}
          />
        </EditorDrawer>
      ) : null}

      {propertiesOpen ? (
        <EditorDrawer
          ref={propertiesDialogRef}
          side="right"
          label="Page properties"
          onClose={closeProperties}
          className="xl:hidden"
        >
          <PropertiesPanel
            instanceId="drawer"
            selectedPage={selectedPage}
            pageCount={pageMeta.length}
            proposalId={proposal.id}
            editorConfig={editorConfig}
            onSaveStateChange={setSaveState}
            onClose={closeProperties}
          />
        </EditorDrawer>
      ) : null}
    </main>
  );
}
