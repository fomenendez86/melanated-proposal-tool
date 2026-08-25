"use client";

import {
  Building2,
  Check,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Eye,
  FileText,
  ImagePlus,
  Layers3,
  LibraryBig,
  ListTree,
  Maximize2,
  MessageSquare,
  Minus,
  Moon,
  Palette,
  Plus,
  Settings2,
  Sparkles,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  CSSProperties,
  FocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
} from "react";
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { updateProposalFields } from "@/app/proposals/[id]/editor/actions";
import { updateProposalDesign } from "@/app/proposals/[id]/editor/designActions";
import { updateProposalSectionVariant } from "@/app/proposals/[id]/editor/compositionActions";
import type { ProposalActivityData } from "@/lib/activity/types";
import type { ProposalSummary } from "@/lib/db/getProposalSummary";
import type { DocumentPageGeometry, ProposalDesignContext } from "@/lib/designs/types";
import type { ProposalCatalogData } from "@/lib/catalog/types";
import type { ProposalCompositionData } from "@/lib/composition/types";
import type { ContentLibraryData } from "@/lib/library/types";
import {
  PROPOSAL_VARIABLES,
  variableToken,
  type ProposalVariableIssue,
} from "@/lib/variables/catalog";
import {
  EDITABLE_REGION_ACTIVE_CLASS,
  EDITABLE_REGION_EDITING_CLASS,
  EDITABLE_REGION_SELECTOR,
  fieldElementId,
  isEditableRegionKind,
  isImageEditableRegion,
  isInlineEditableRegion,
} from "@/lib/editor/editableRegions";
import type { EditableRegionKind } from "@/lib/editor/editableRegions";
import type {
  EditorSaveState,
  ProposalEditorFieldName,
  ProposalEditorPageConfig,
  ProposalEditorPageMap,
} from "@/lib/editor/proposalEditorTypes";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";
import { computeSectionRuns } from "@/lib/editor/sectionRuns";

import ActivityPanel from "./ActivityPanel";
import ItineraryEditor from "./ItineraryEditor";
import PricingItemsEditor from "./PricingItemsEditor";
import CatalogPanel from "./CatalogPanel";
import CompositionPanel from "./CompositionPanel";
import InsertionGap from "./InsertionGap";
import PageNavigator from "./PageNavigator";
import PdfGenerateButton from "./PdfGenerateButton";
import SaveAsTemplateButton from "./SaveAsTemplateButton";
import ShareProposalButton from "./ShareProposalButton";
import SendProposalButton from "./SendProposalButton";
import { useCatalogDragInsert } from "./useCatalogDragInsert";
import {
  EditorButton,
  EditorDrawer,
  EditorEmptyState,
  EditorField,
  EditorInspectorSection,
  EditorNotice,
  EditorPanelHeader,
  EditorSegmentedControl,
  EditorStatusBadge,
  editorFocusRing,
} from "./EditorUi";

interface ProposalEditorShellProps {
  proposal: ProposalSummary;
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
  editorPages: ProposalEditorPageMap;
  designContext: ProposalDesignContext;
  catalog: ProposalCatalogData;
  library: ContentLibraryData;
  composition: ProposalCompositionData;
  activity: ProposalActivityData;
  variableIssues: ProposalVariableIssue[];
}

interface RegionFocusRequest {
  field: ProposalEditorFieldName;
  requestId: number;
}

interface PropertiesPanelProps {
  instanceId: "desktop" | "drawer";
  selectedPage: ProposalPageMeta;
  pageCount: number;
  proposalId: number;
  editorConfig?: ProposalEditorPageConfig;
  designContext: ProposalDesignContext;
  designChanging: boolean;
  designError: string;
  onDesignChange: (designKey: string) => void;
  activeVariantId?: string;
  onVariantChange: (variantId: string) => void;
  onSaveStateChange: (state: EditorSaveState) => void;
  onClose?: () => void;
  mode: "content" | "design";
  onModeChange: (mode: "content" | "design") => void;
  /** Shared draft/save state for the selected page's simple field form. */
  draft: PageFieldDraft;
  /** Set when a canvas click should scroll/focus a field in this panel. */
  focusField?: RegionFocusRequest;
  /** Notifies the canvas bridge that a field gained focus via the inspector. */
  onFieldFocus: (field: ProposalEditorFieldName) => void;
  /** Escape inside a field returns focus to this page's canvas region. */
  onEscapeToCanvas: () => void;
  library: ContentLibraryData;
}

interface ReviewPanelProps {
  pageMeta: ProposalPageMeta[];
  overflowPageIndexes: number[];
  designContext: ProposalDesignContext;
  saveState: EditorSaveState;
  designError: string;
  variableIssues: ProposalVariableIssue[];
  openThreadCount: number;
  onClose: () => void;
}

const STATUS_COPY: Record<ProposalSummary["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
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
  viewed: "neutral",
  approved: "success",
  won: "success",
  lost: "danger",
  archived: "neutral",
};

const SAVE_TONE: Record<EditorSaveState, "neutral" | "warning" | "success" | "danger"> = {
  loaded: "neutral",
  dirty: "warning",
  saving: "warning",
  saved: "success",
  error: "danger",
};

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(3))));
}

function fieldValues(config: ProposalEditorPageConfig) {
  return Object.fromEntries(config.fields.map((field) => [field.name, field.value])) as Partial<
    Record<ProposalEditorFieldName, string>
  >;
}

/**
 * Owns the draft/save state for the selected page's simple field form. Called
 * once in the shell (not inside `EditableFieldsForm`, which is instantiated
 * twice — desktop and drawer) so the inspector and the Phase 10.3 canvas
 * overlay read and write the exact same state: one draft, two views, one
 * autosave. `config` may be undefined (itinerary pages and pages without an
 * editable form use their own flow) — the hook is inert in that case.
 */
function usePageFieldDraft(
  proposalId: number,
  config: ProposalEditorPageConfig | undefined,
  onSaveStateChange: (state: EditorSaveState) => void
) {
  const router = useRouter();
  const initialValues = useMemo(() => (config ? fieldValues(config) : {}), [config]);
  const [renderedPageId, setRenderedPageId] = useState(config?.pageId);
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProposalEditorFieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const requestNumberRef = useRef(0);
  const autosaveTimeoutRef = useRef<number | null>(null);

  // Reset the draft when the selected page changes, without an effect (which
  // would render one stale frame first): the standard React pattern for
  // resetting state derived from a changing identity.
  if (config?.pageId !== renderedPageId) {
    setRenderedPageId(config?.pageId);
    setValues(initialValues);
    setSavedValues(initialValues);
    setFieldErrors({});
    setFormError("");
  }

  const valuesKey = JSON.stringify(values);
  const savedValuesKey = JSON.stringify(savedValues);
  const isDirty = valuesKey !== savedValuesKey;

  const saveDraft = useCallback(async (draft: typeof values) => {
    if (!config) return;
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
  }, [config, onSaveStateChange, proposalId, router, savedValues]);

  useEffect(() => {
    if (!config || !isDirty || config.saveMode === "explicit") return;
    onSaveStateChange("dirty");
    autosaveTimeoutRef.current = window.setTimeout(() => void saveDraft(values), 800);
    return () => {
      if (autosaveTimeoutRef.current !== null) window.clearTimeout(autosaveTimeoutRef.current);
    };
  }, [config, isDirty, onSaveStateChange, saveDraft, values, valuesKey]);

  const setFieldValue = useCallback((name: ProposalEditorFieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    onSaveStateChange("dirty");
  }, [onSaveStateChange]);

  const saveNow = useCallback(() => {
    if (config && isDirty && config.saveMode !== "explicit") void saveDraft(values);
  }, [config, isDirty, saveDraft, values]);

  return { values, fieldErrors, formError, isDirty, setFieldValue, saveDraft, saveNow };
}

type PageFieldDraft = ReturnType<typeof usePageFieldDraft>;

function EditableFieldsForm({
  config,
  instanceId,
  draft,
  focusField,
  onFieldFocus,
  onEscapeToCanvas,
  snippets,
  images,
}: {
  config: ProposalEditorPageConfig;
  instanceId: PropertiesPanelProps["instanceId"];
  draft: PageFieldDraft;
  focusField?: RegionFocusRequest;
  onFieldFocus: (field: ProposalEditorFieldName) => void;
  onEscapeToCanvas: () => void;
  snippets: ContentLibraryData["snippets"];
  images: ContentLibraryData["images"];
}) {
  const { values, fieldErrors, formError, isDirty, setFieldValue, saveDraft } = draft;

  function handleFormBlur(event: FocusEvent<HTMLFormElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    if (isDirty && config.saveMode !== "explicit") void saveDraft(values);
  }

  function insertText(field: ProposalEditorFieldName, body: string) {
    const element = document.getElementById(fieldElementId(instanceId, config.pageId, field)) as HTMLTextAreaElement | null;
    const current = values[field] ?? "";
    const start = element?.selectionStart ?? current.length;
    const end = element?.selectionEnd ?? start;
    const next = `${current.slice(0, start)}${body}${current.slice(end)}`;
    setFieldValue(field, next);
    window.requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + body.length, start + body.length);
    });
  }

  useEffect(() => {
    if (!focusField) return;
    const element = document.getElementById(fieldElementId(instanceId, config.pageId, focusField.field));
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    (element as HTMLInputElement | HTMLTextAreaElement | null)?.focus();
    // Re-run whenever a new activation request lands, even for the same field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusField?.requestId]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void saveDraft(values);
      }}
      onBlur={handleFormBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") onEscapeToCanvas();
      }}
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
          <div key={field.name}>
            <EditorField
              field={field}
              id={fieldElementId(instanceId, config.pageId, field.name)}
              value={values[field.name] ?? ""}
              error={error}
              rows={config.saveMode === "explicit" ? 10 : 3}
              onChange={(event) => setFieldValue(field.name, event.target.value)}
              onFocus={() => onFieldFocus(field.name)}
            />
            {field.multiline && snippets.length ? (
              <select aria-label={`Insert snippet into ${field.label}`} defaultValue="" onChange={(event) => { const selected = snippets.find((item) => item.id === Number(event.target.value)); if (selected) insertText(field.name, selected.body); event.currentTarget.value = ""; }} className={`mt-1 h-9 w-full rounded-lg border border-editor-border bg-editor-raised px-2 text-xs text-editor-text ${editorFocusRing}`}>
                <option value="">Insert text snippet…</option>
                {snippets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            ) : null}
            {!field.isImage && !["invoiceTotal", "commission", "amountDue", "nights", "currency"].includes(field.name) ? (
              <select aria-label={`Insert variable into ${field.label}`} defaultValue="" onChange={(event) => { const selected = PROPOSAL_VARIABLES.find((item) => item.path === event.target.value); if (selected) insertText(field.name, variableToken(selected.path)); event.currentTarget.value = ""; }} className={`mt-1 h-9 w-full rounded-lg border border-editor-border bg-editor-raised px-2 text-xs text-editor-text ${editorFocusRing}`}>
                <option value="">{"{{}}"} Insert variable…</option>
                {PROPOSAL_VARIABLES.map((item) => <option key={item.path} value={item.path}>{item.group} · {item.label}</option>)}
              </select>
            ) : null}
            {field.isImage && images.length ? (
              <select aria-label={`Choose library image for ${field.label}`} defaultValue="" onChange={(event) => { const selected = images.find((item) => item.id === Number(event.target.value)); if (selected) setFieldValue(field.name, selected.url); event.currentTarget.value = ""; }} className={`mt-1 h-9 w-full rounded-lg border border-editor-border bg-editor-raised px-2 text-xs text-editor-text ${editorFocusRing}`}>
                <option value="">Choose from image library…</option>
                {images.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            ) : null}
          </div>
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

const INLINE_EDITED_STYLE_PROPERTIES: Array<keyof CSSProperties> = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "color",
  "writingMode",
  "direction",
  "padding",
];

/**
 * Phase 10.3 inline canvas editor. Portals a plain input/textarea over the
 * clicked region, sized and styled to match it, and reads/writes the exact
 * same draft as the inspector (`draft` is one shared `usePageFieldDraft`
 * instance) — typing here and typing in the inspector are the same action.
 */
interface InlineEditorGeometry {
  rect: { left: number; top: number; width: number; height: number };
  style: CSSProperties;
  multiline: boolean;
  ariaLabel: string | null;
}

function InlineRegionEditor({
  pageRefs,
  pageIndex,
  field,
  draft,
  onClose,
  snippets,
}: {
  pageRefs: RefObject<Array<HTMLDivElement | null>>;
  pageIndex: number;
  field: ProposalEditorFieldName;
  draft: PageFieldDraft;
  onClose: () => void;
  snippets: ContentLibraryData["snippets"];
}) {
  const [geometry, setGeometry] = useState<InlineEditorGeometry | null>(null);
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);

  // Keep the ref used by the unmount-save cleanup current every render,
  // without writing to a ref during render itself.
  useEffect(() => {
    draftRef.current = draft;
  });

  // Refs (pageRefs, the resolved DOM nodes) are only ever read here, never
  // during render, and setting geometry from a real layout measurement is
  // the documented exception to "don't setState in an effect" — there is no
  // width/position to compute until after the page has actually painted.
  useLayoutEffect(() => {
    const pageElement = pageRefs.current[pageIndex];
    const content = pageElement?.querySelector<HTMLElement>("[data-page-content]") ?? null;
    const target = content?.querySelector<HTMLElement>(`[data-edit-field="${field}"]`) ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContentElement(content);
    if (!target || !content) return;

    // The content container keeps its unscaled CSS size (offsetWidth) while
    // `transform: scale(zoom)` changes only its rendered size — dividing the
    // two derives the current zoom without a prop, and self-corrects if the
    // user zooms the canvas while this overlay is open.
    const zoom = content.offsetWidth > 0
      ? content.getBoundingClientRect().width / content.offsetWidth
      : 1;
    const contentRect = content.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const computed = window.getComputedStyle(target);
    const style: Record<string, string> = {};
    for (const property of INLINE_EDITED_STYLE_PROPERTIES) {
      const value = computed[property as unknown as keyof CSSStyleDeclaration];
      if (typeof value === "string") style[property] = value;
    }

    setGeometry({
      rect: {
        left: (targetRect.left - contentRect.left) / zoom,
        top: (targetRect.top - contentRect.top) / zoom,
        width: targetRect.width / zoom,
        height: targetRect.height / zoom,
      },
      style: style as CSSProperties,
      multiline: target.getAttribute("data-edit-kind") === "multiline",
      ariaLabel: target.getAttribute("aria-label"),
    });

    target.classList.add(EDITABLE_REGION_EDITING_CLASS);
    return () => {
      target.classList.remove(EDITABLE_REGION_EDITING_CLASS);
    };
  }, [pageRefs, pageIndex, field]);

  const isPositioned = geometry !== null;
  useEffect(() => {
    // `geometry` starts null (the layout effect above hasn't measured yet),
    // so this component's very first commit renders nothing and there is no
    // input/textarea to focus. Depending on `[]` would run only against that
    // empty first commit and never fire once the control actually mounts —
    // keying on "geometry just became available" catches the real mount.
    if (!isPositioned) return;
    const control = inputRef.current ?? textareaRef.current;
    control?.focus();
    control?.select();
  }, [isPositioned]);

  useEffect(() => () => {
    draftRef.current.saveNow();
  }, []);

  if (!geometry || !contentElement) return null;

  const value = draft.values[field] ?? "";
  const error = draft.fieldErrors[field];
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Enter" && !geometry.multiline && !event.shiftKey) {
      event.preventDefault();
      onClose();
    }
  };
  const style: CSSProperties = {
    left: geometry.rect.left,
    top: geometry.rect.top,
    width: geometry.rect.width,
    height: geometry.rect.height,
    ...geometry.style,
  };
  const className = `proposal-studio-inline-editor${error ? " proposal-studio-inline-editor-error" : ""}`;
  function insertSnippet(body: string) {
    const control = inputRef.current ?? textareaRef.current;
    const current = draft.values[field] ?? "";
    const start = control?.selectionStart ?? current.length;
    const end = control?.selectionEnd ?? start;
    draft.setFieldValue(field, `${current.slice(0, start)}${body}${current.slice(end)}`);
    window.requestAnimationFrame(() => {
      control?.focus();
      control?.setSelectionRange(start + body.length, start + body.length);
    });
  }

  return createPortal(
    <>
      {geometry.multiline ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => draft.setFieldValue(field, event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(event) => { if (!toolbarRef.current?.contains(event.relatedTarget as Node | null)) onClose(); }}
          aria-label={geometry.ariaLabel ?? undefined}
          className={className}
          style={style}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => draft.setFieldValue(field, event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(event) => { if (!toolbarRef.current?.contains(event.relatedTarget as Node | null)) onClose(); }}
          aria-label={geometry.ariaLabel ?? undefined}
          className={className}
          style={style}
        />
      )}
      {(geometry.multiline && snippets.length) || PROPOSAL_VARIABLES.length ? (
        <div ref={toolbarRef} className="absolute z-20 flex max-w-[82%] gap-1 overflow-hidden rounded-lg border border-editor-border bg-editor-panel p-1 shadow-lg" style={{ left: geometry.rect.left, top: Math.max(0, geometry.rect.top - 36) }} aria-label="Inline insert tools">
          {snippets.slice(0, 3).map((snippet) => <button key={snippet.id} type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => insertSnippet(snippet.body)} className="h-7 truncate rounded px-2 text-[10px] font-semibold text-editor-text hover:bg-editor-inset" aria-label={`Insert snippet ${snippet.name}`}>{snippet.name}</button>)}
          <select aria-label="Insert variable" defaultValue="" onChange={(event) => { const selected = PROPOSAL_VARIABLES.find((item) => item.path === event.target.value); if (selected) insertSnippet(variableToken(selected.path)); event.currentTarget.value = ""; }} className="h-7 max-w-40 rounded border-0 bg-editor-raised px-2 text-[10px] font-semibold text-editor-text">
            <option value="">{"{{}}"} Variable…</option>
            {PROPOSAL_VARIABLES.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}
          </select>
        </div>
      ) : null}
    </>,
    contentElement
  );
}

const IMAGE_POPOVER_WIDTH = 256;
const IMAGE_POPOVER_GAP = 8;

/**
 * Phase 10.4 canvas image popover. Anchored just below the clicked `image`
 * region (portaled into the same `[data-page-content]` node as
 * `InlineRegionEditor`, so it inherits zoom/scroll for free) and reads/writes
 * the same shared `usePageFieldDraft` instance as the inspector — one field,
 * two surfaces, same autosave and server-side URL validation (Phase 2.1).
 * Only reached for auto-save pages (`isImageEditableRegion`); explicit-save
 * pages (Hotel, From Owners) keep the Phase 10.2 jump-to-inspector flow,
 * where `EditorField` renders the same thumbnail+URL control.
 */
function ImageRegionPopover({
  pageRefs,
  pageIndex,
  field,
  label,
  draft,
  onClose,
  images,
}: {
  pageRefs: RefObject<Array<HTMLDivElement | null>>;
  pageIndex: number;
  field: ProposalEditorFieldName;
  label: string;
  draft: PageFieldDraft;
  onClose: () => void;
  images: ContentLibraryData["images"];
}) {
  const [geometry, setGeometry] = useState<{ left: number; top: number } | null>(null);
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(draft);
  const inputId = useId();

  useEffect(() => {
    draftRef.current = draft;
  });

  // Same measurement approach as InlineRegionEditor: convert the target's
  // screen rect into content-local, unscaled coordinates so the popover (a
  // DOM child of `content`) inherits the page's own zoom transform.
  useLayoutEffect(() => {
    const pageElement = pageRefs.current[pageIndex];
    const content = pageElement?.querySelector<HTMLElement>("[data-page-content]") ?? null;
    const target = content?.querySelector<HTMLElement>(`[data-edit-field="${field}"]`) ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContentElement(content);
    if (!target || !content) return;

    const zoom = content.offsetWidth > 0
      ? content.getBoundingClientRect().width / content.offsetWidth
      : 1;
    const contentRect = content.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = (targetRect.left - contentRect.left) / zoom;
    const top = (targetRect.bottom - contentRect.top) / zoom + IMAGE_POPOVER_GAP;
    const maxLeft = Math.max(0, content.offsetWidth - IMAGE_POPOVER_WIDTH);

    setGeometry({ left: Math.min(Math.max(left, 0), maxLeft), top });
  }, [pageRefs, pageIndex, field]);

  // Re-clamp against the popover's real measured height once it has
  // rendered — the estimate above has no height to clamp against yet.
  useLayoutEffect(() => {
    if (!geometry || !popoverRef.current || !contentElement) return;
    const maxTop = Math.max(0, contentElement.offsetHeight - popoverRef.current.offsetHeight - IMAGE_POPOVER_GAP);
    if (geometry.top > maxTop) setGeometry((current) => (current ? { ...current, top: maxTop } : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry?.left, geometry?.top, contentElement]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [onClose]);

  const isPositioned = geometry !== null;
  useEffect(() => {
    // Mirrors InlineRegionEditor: `geometry` starts null, so the very first
    // commit renders nothing and there is no input to focus yet. Keying on
    // "just became positioned" (rather than `[]`) catches the real mount.
    if (!isPositioned) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isPositioned]);

  useEffect(() => () => {
    draftRef.current.saveNow();
  }, []);

  if (!geometry || !contentElement) return null;

  const value = draft.values[field] ?? "";
  const error = draft.fieldErrors[field];

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Replace ${label}`}
      className="absolute z-10 rounded-xl border border-editor-border-strong bg-white p-3 shadow-2xl"
      style={{ left: geometry.left, top: geometry.top, width: IMAGE_POPOVER_WIDTH }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-editor-inset">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="size-5 text-editor-text-subtle" aria-hidden="true" />
        )}
      </div>
      <label htmlFor={inputId} className="mt-2 block text-xs font-semibold text-editor-text">{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => draft.setFieldValue(field, event.target.value)}
        placeholder="/proposal-assets/... or https://"
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full rounded-lg border bg-editor-raised px-3 py-2 text-sm text-editor-text-strong outline-none transition placeholder:text-editor-text-subtle focus:border-editor-border-strong focus:ring-2 focus:ring-editor-border-strong/20 ${error ? "border-editor-danger" : "border-editor-border"}`}
      />
      {images.length ? (
        <select aria-label={`Choose library image for ${label}`} defaultValue="" onChange={(event) => { const selected = images.find((item) => item.id === Number(event.target.value)); if (selected) draft.setFieldValue(field, selected.url); event.currentTarget.value = ""; }} className="mt-2 h-9 w-full rounded-lg border border-editor-border bg-editor-raised px-2 text-xs text-editor-text">
          <option value="">Choose from library…</option>
          {images.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      ) : null}
      <p className={`mt-1 text-[11px] ${error ? "text-editor-danger" : "text-editor-text-subtle"}`}>
        {error ?? "Use a local /path or an https:// URL."}
      </p>
    </div>,
    contentElement
  );
}

function PropertiesPanel({
  instanceId,
  selectedPage,
  pageCount,
  proposalId,
  editorConfig,
  designContext,
  designChanging,
  designError,
  onDesignChange,
  activeVariantId,
  onVariantChange,
  onSaveStateChange,
  onClose,
  mode,
  onModeChange,
  draft,
  focusField,
  onFieldFocus,
  onEscapeToCanvas,
  library,
}: PropertiesPanelProps) {
  const variants = designContext.active.sectionVariants[selectedPage.type] ?? [];
  const defaultVariantId = designContext.active.defaultVariantIds[selectedPage.type];

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
          <EditorSegmentedControl
            label="Inspector mode"
            value={mode}
            options={[
              { value: "content", label: "Content" },
              { value: "design", label: "Design" },
            ]}
            onChange={onModeChange}
            className="mt-4 flex w-full"
          />
        </div>

        <div className="space-y-6 p-5">
          <div hidden={mode !== "content"}>
            {editorConfig?.kind === "pricing" ? (
              <PricingItemsEditor proposalId={proposalId} items={editorConfig.pricingItems ?? []} fees={library.fees} />
            ) : null}
            {editorConfig?.kind === "itinerary" ? (
              <ItineraryEditor
                key={editorConfig.pageId}
                proposalId={proposalId}
                config={editorConfig}
                onSaveStateChange={onSaveStateChange}
                focusRequestId={focusField?.requestId}
              />
            ) : editorConfig ? (
              <EditableFieldsForm
                config={editorConfig}
                instanceId={instanceId}
                draft={draft}
                focusField={focusField}
                onFieldFocus={onFieldFocus}
                onEscapeToCanvas={onEscapeToCanvas}
                snippets={library.snippets}
                images={library.images}
              />
            ) : (
              <EditorEmptyState
                title="Preview only"
                description="This page is available for review but has no editable fields in the active document design."
                icon={<Eye className="size-5" />}
              />
            )}
          </div>

          <div hidden={mode !== "design"} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-editor-brand">
                <Palette className="size-4" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{designContext.active.name}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-editor-text-muted">
                Design v{designContext.active.version} · {designContext.active.page.formatLabel} · {designContext.active.page.orientation}
              </p>
            </div>

            <div>
              <label htmlFor={`inspector-document-design-${instanceId}`} className="text-xs font-semibold text-editor-text">
                Document design
              </label>
              <select
                id={`inspector-document-design-${instanceId}`}
                value={`${designContext.active.id}@${designContext.active.version}`}
                disabled={designChanging}
                onChange={(event) => onDesignChange(event.target.value)}
                className={`mt-1.5 h-11 w-full rounded-lg border border-editor-border bg-editor-raised px-3 text-sm font-semibold text-editor-text outline-none transition hover:border-editor-border-strong disabled:cursor-wait disabled:text-editor-disabled-text ${editorFocusRing}`}
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
              {designError ? (
                <p className="mt-1.5 text-xs leading-4 text-editor-danger">{designError}</p>
              ) : null}
            </div>

            {variants.length > 0 ? (
              <EditorInspectorSection id={`layout-variants-heading-${instanceId}`} title="Approved layout">
                <div className="space-y-2">
                  {variants.map((variant) => {
                    const active = variant.id === (activeVariantId ?? defaultVariantId);
                    return (
                      <button
                        type="button"
                        key={variant.id}
                        onClick={() => onVariantChange(variant.id)}
                        aria-pressed={active}
                        className={`w-full rounded-xl border p-3.5 text-left ${editorFocusRing} ${active ? "border-editor-border-strong bg-editor-inset" : "border-editor-border-subtle bg-editor-raised hover:border-editor-border"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-editor-text">{variant.label}</p>
                          {active ? <EditorStatusBadge tone="success">Default</EditorStatusBadge> : null}
                        </div>
                        <p className="mt-1 text-xs leading-4 text-editor-text-muted">{variant.description}</p>
                      </button>
                    );
                  })}
                </div>
              </EditorInspectorSection>
            ) : (
              <EditorEmptyState
                compact
                title="Protected layout"
                description="This page uses the design's validated default and has no alternate layout variants."
                icon={<Palette className="size-5" />}
              />
            )}

            <EditorNotice tone="info" title="Design-safe editing">
              Layout geometry and brand styling are supplied by the active document design. Content changes remain proposal-specific.
            </EditorNotice>
          </div>

          <details className="group rounded-xl border border-editor-border-subtle bg-editor-raised">
            <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-editor-text-muted ${editorFocusRing}`}>
              Page information
              <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <dl className="divide-y divide-editor-border-subtle border-t border-editor-border-subtle px-3.5">
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
          </details>

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

function ReviewPanel({ pageMeta, overflowPageIndexes, designContext, saveState, designError, variableIssues, openThreadCount, onClose }: ReviewPanelProps) {
  const pageIssues = pageMeta.filter((page) => page.status === "warning" || page.status === "error");
  const incompatibleDesigns = designContext.choices.filter((choice) => !choice.compatible);
  const hasUnsavedChanges = saveState === "dirty" || saveState === "saving" || saveState === "error";
  const issueCount = pageIssues.length + overflowPageIndexes.length + incompatibleDesigns.length + variableIssues.length + (hasUnsavedChanges ? 1 : 0) + (designError ? 1 : 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-editor-panel">
      <EditorPanelHeader
        icon={<ClipboardCheck className="size-4" />}
        label="Proposal review"
        count={issueCount}
        onClose={onClose}
        closeLabel="Close proposal review"
      />
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-editor-text-muted">Readiness</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-editor-text-strong">
            {issueCount === 0 ? "Ready to preview" : `${issueCount} item${issueCount === 1 ? "" : "s"} to review`}
          </h2>
          <p className="mt-2 text-sm leading-5 text-editor-text-muted">
            Review checks saved content, document compatibility, and the current editor state.
          </p>
        </div>

        {issueCount === 0 ? (
          <EditorNotice tone="success" title="All current checks passed">
            Every rendered page is ready and {designContext.active.name} supports the proposal&apos;s saved sections.
          </EditorNotice>
        ) : null}

        {hasUnsavedChanges ? (
          <EditorNotice tone={saveState === "error" ? "danger" : "warning"} title={SAVE_COPY[saveState]}>
            Save or resolve the current draft before generating final output.
          </EditorNotice>
        ) : null}

        {designError ? (
          <EditorNotice tone="danger" title="Design change failed">{designError}</EditorNotice>
        ) : null}

        {variableIssues.length > 0 ? (
          <EditorInspectorSection id="review-variable-issues-heading" title="Merge fields">
            <div className="space-y-2">
              {variableIssues.map((issue) => (
                <EditorNotice key={issue.path} tone={issue.required ? "danger" : "warning"} title={issue.required ? "Required variable unresolved" : "Variable unresolved"}>
                  {issue.token}{issue.required ? " must have a value before sharing." : " will remain visible until its source value is completed."}
                </EditorNotice>
              ))}
            </div>
          </EditorInspectorSection>
        ) : null}

        {openThreadCount > 0 ? (
          <EditorNotice tone="info" title="Open client comment threads">
            {openThreadCount} thread{openThreadCount === 1 ? "" : "s"} still open. Review and reply from Activity before re-sharing — this does not block sharing.
          </EditorNotice>
        ) : null}

        {overflowPageIndexes.length > 0 ? (
          <EditorNotice tone="danger" title="Measured page overflow">
            Content exceeds the printable area on page{overflowPageIndexes.length === 1 ? "" : "s"} {overflowPageIndexes.map((index) => index + 1).join(", ")}. Shorten the content or split the affected section before generating the final PDF.
          </EditorNotice>
        ) : null}

        {pageIssues.length > 0 ? (
          <EditorInspectorSection id="review-page-issues-heading" title="Page issues">
            <div className="space-y-2">
              {pageIssues.map((page) => (
                <div key={page.id} className="rounded-xl border border-editor-warning-border bg-editor-warning-surface p-3.5">
                  <p className="text-sm font-semibold text-editor-warning">Page {page.pageNumber} · {page.title}</p>
                  <p className="mt-1 text-xs text-editor-warning">Status: {page.status}</p>
                </div>
              ))}
            </div>
          </EditorInspectorSection>
        ) : null}

        {incompatibleDesigns.length > 0 ? (
          <EditorInspectorSection id="review-compatibility-heading" title="Design compatibility">
            <div className="space-y-2">
              {incompatibleDesigns.map(({ design, unsupportedSectionTypes }) => (
                <div key={`${design.id}@${design.version}`} className="rounded-xl border border-editor-border-subtle bg-editor-raised p-3.5">
                  <p className="text-sm font-semibold text-editor-text">{design.name} v{design.version}</p>
                  <p className="mt-1 text-xs leading-4 text-editor-text-muted">
                    Unsupported: {unsupportedSectionTypes.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </EditorInspectorSection>
        ) : null}

        <EditorInspectorSection id="review-summary-heading" title="Current document">
          <dl className="divide-y divide-editor-border-subtle rounded-xl border border-editor-border-subtle bg-editor-raised px-3.5">
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-editor-text-muted">Design</dt>
              <dd className="font-semibold text-editor-text">{designContext.active.name} v{designContext.active.version}</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-editor-text-muted">Rendered pages</dt>
              <dd className="font-semibold tabular-nums text-editor-text">{pageMeta.length}</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-editor-text-muted">Page format</dt>
              <dd className="font-semibold text-editor-text">{designContext.active.page.formatLabel}</dd>
            </div>
          </dl>
        </EditorInspectorSection>
      </div>
    </div>
  );
}

function useFitCanvas(
  viewportRef: RefObject<HTMLDivElement | null>,
  setZoom: (value: number) => void,
  pageSize: DocumentPageGeometry
) {
  const fitCanvas = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const horizontalPadding = viewport.clientWidth < 640 ? 32 : 72;
    const widthScale = (viewport.clientWidth - horizontalPadding) / pageSize.widthPx;
    setZoom(clampZoom(Math.min(widthScale, MAX_ZOOM)));
  }, [pageSize.widthPx, setZoom, viewportRef]);

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
  catalog,
  library,
  composition,
  activity,
  variableIssues,
}: ProposalEditorShellProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(0.65);
  const [filter, setFilter] = useState("");
  const [pagesOpen, setPagesOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("proposal-studio-theme") === "dark" ? "dark" : "light";
  });
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [saveState, setSaveState] = useState<EditorSaveState>("loaded");
  const [designChanging, setDesignChanging] = useState(false);
  const [designError, setDesignError] = useState("");
  const [overflowPageIndexes, setOverflowPageIndexes] = useState<number[]>([]);
  const [inspectorMode, setInspectorMode] = useState<"content" | "design">("content");
  const [activeRegion, setActiveRegion] = useState<{ pageId: string; field: ProposalEditorFieldName; requestId: number } | null>(null);
  const [highlightedField, setHighlightedField] = useState<ProposalEditorFieldName | null>(null);
  const [regionAnnouncement, setRegionAnnouncement] = useState("");
  const [activeInlineEdit, setActiveInlineEdit] = useState<{ pageId: string; pageIndex: number; field: ProposalEditorFieldName } | null>(null);
  const [activeImageEdit, setActiveImageEdit] = useState<{ pageId: string; pageIndex: number; field: ProposalEditorFieldName; label: string } | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const pagesDialogRef = useRef<HTMLDivElement>(null);
  const propertiesDialogRef = useRef<HTMLDivElement>(null);
  const reviewDialogRef = useRef<HTMLDivElement>(null);
  const activityDialogRef = useRef<HTMLDivElement>(null);
  const catalogDialogRef = useRef<HTMLDivElement>(null);
  const compositionDialogRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const regionRequestIdRef = useRef(0);
  const highlightedElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    window.localStorage.setItem("proposal-studio-theme", theme);
  }, [theme]);

  const effectiveSelectedIndex = Math.min(selectedIndex, Math.max(0, pageMeta.length - 1));
  const selectedPage = pageMeta[effectiveSelectedIndex];
  const editorConfig = editorPages[selectedPage.id];
  const pageSize = designContext.active.page;
  const activeDesignKey = `${designContext.active.id}@${designContext.active.version}`;
  const activeVariantId = composition.items.find((item) => item.id === selectedPage.sourceSectionId)?.variantId;
  const sectionRuns = useMemo(() => computeSectionRuns(pageMeta), [pageMeta]);
  const runIndexByPageId = useMemo(() => {
    const map = new Map<string, number>();
    sectionRuns.forEach((run, index) => map.set(run.firstPageId, index));
    return map;
  }, [sectionRuns]);
  const runStartPageIndexes = useMemo(
    () => sectionRuns.map((run) => pageMeta.findIndex((page) => page.id === run.firstPageId)),
    [pageMeta, sectionRuns]
  );
  const { startDrag, draggingItem, ghostPosition, hoveredAfterSectionId } = useCatalogDragInsert({
    proposalId: proposal.id,
    sectionRuns,
    runStartPageIndexes,
    pageRefs,
    canvasViewportRef,
    announce: setRegionAnnouncement,
  });
  const focusField = activeRegion && activeRegion.pageId === selectedPage.id
    ? { field: activeRegion.field, requestId: activeRegion.requestId }
    : undefined;
  // Itinerary pages manage their own state in ItineraryEditor; every other
  // editable page shares this one draft between the inspector and the
  // Phase 10.3 canvas overlay.
  const pageFieldDraft = usePageFieldDraft(
    proposal.id,
    editorConfig?.kind === "itinerary" ? undefined : editorConfig,
    setSaveState
  );
  useEffect(() => {
    pageRefs.current.forEach((pageElement, pageIndex) => {
      if (!pageElement) return;
      const config = editorPages[pageMeta[pageIndex]?.id ?? ""];
      const variableFields = new Set(
        (config?.fields ?? [])
          .filter((field) => field.value.includes("{{"))
          .map((field) => field.name)
      );
      pageElement.querySelectorAll<HTMLElement>(EDITABLE_REGION_SELECTOR).forEach((region) => {
        const field = region.getAttribute("data-edit-field") as ProposalEditorFieldName | null;
        region.classList.toggle("proposal-studio-variable-region", Boolean(field && variableFields.has(field)));
      });
    });
  }, [editorPages, pageMeta, pages]);
  const inlineEdit = activeInlineEdit && activeInlineEdit.pageId === selectedPage.id ? activeInlineEdit : null;
  const imageEdit = activeImageEdit && activeImageEdit.pageId === selectedPage.id ? activeImageEdit : null;
  const fitCanvas = useFitCanvas(canvasViewportRef, setZoom, pageSize);

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

  const changeSectionVariant = useCallback(async (variantId: string) => {
    if (!selectedPage.sourceSectionId || variantId === activeVariantId) return;
    if (!confirmDiscardDraft()) return;
    setSaveState("saving");
    setDesignError("");
    const result = await updateProposalSectionVariant(proposal.id, selectedPage.sourceSectionId, variantId);
    if (!result.ok) {
      setDesignError(result.formError ?? "The layout variant could not be saved.");
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    router.refresh();
  }, [activeVariantId, confirmDiscardDraft, proposal.id, router, selectedPage.sourceSectionId]);

  const navigateToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const nextIndex = Math.min(pageMeta.length - 1, Math.max(0, index));
    if (nextIndex !== selectedIndex && !confirmDiscardDraft()) return false;
    setSelectedIndex(nextIndex);
    pageRefs.current[nextIndex]?.scrollIntoView({ behavior, block: "start" });
    return true;
  }, [confirmDiscardDraft, pageMeta.length, selectedIndex]);

  const selectPage = useCallback((page: ProposalPageMeta) => {
    const index = pageMeta.findIndex((candidate) => candidate.id === page.id);
    if (index >= 0) {
      navigateToIndex(index);
      setPagesOpen(false);
    }
  }, [navigateToIndex, pageMeta]);

  const activateRegion = useCallback((pageIndex: number, field: ProposalEditorFieldName, kind: EditableRegionKind) => {
    const targetPage = pageMeta[pageIndex];
    if (!targetPage) return;
    if (pageIndex !== effectiveSelectedIndex && !navigateToIndex(pageIndex)) return;

    const targetConfig = editorPages[targetPage.id];
    const label = targetConfig?.fields.find((candidate) => candidate.name === field)?.label ?? field;

    setInspectorMode("content");
    setHighlightedField(field);
    setRegionAnnouncement(`Editing ${label}`);

    if (isImageEditableRegion(kind, targetConfig?.saveMode)) {
      // Phase 10.4: replace the image from a popover anchored on the page.
      // Same shared draft as the inspector, so it stays in sync.
      setActiveInlineEdit(null);
      setActiveImageEdit({ pageId: targetPage.id, pageIndex, field, label });
      return;
    }

    if (isInlineEditableRegion(field, kind, targetConfig?.saveMode)) {
      // Phase 10.3: edit directly on the page. The inspector still shows the
      // same shared draft, so it stays in sync without a second focus jump.
      setActiveImageEdit(null);
      setActiveInlineEdit({ pageId: targetPage.id, pageIndex, field });
      return;
    }

    setActiveInlineEdit(null);
    setActiveImageEdit(null);
    regionRequestIdRef.current += 1;
    setActiveRegion({ pageId: targetPage.id, field, requestId: regionRequestIdRef.current });

    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1280px)").matches) {
      setPropertiesOpen(true);
    }
  }, [editorPages, effectiveSelectedIndex, navigateToIndex, pageMeta]);

  const focusCanvasPage = useCallback((pageId: string) => {
    const index = pageMeta.findIndex((candidate) => candidate.id === pageId);
    if (index >= 0) pageRefs.current[index]?.focus();
  }, [pageMeta]);

  const closeInlineEdit = useCallback(() => {
    setActiveInlineEdit((current) => {
      if (current) focusCanvasPage(current.pageId);
      return null;
    });
  }, [focusCanvasPage]);

  const closeImageEdit = useCallback(() => {
    setActiveImageEdit((current) => {
      if (current) focusCanvasPage(current.pageId);
      return null;
    });
  }, [focusCanvasPage]);

  const activateRegionFromElement = useCallback((element: HTMLElement) => {
    const field = element.getAttribute("data-edit-field") as ProposalEditorFieldName | null;
    const kind = element.getAttribute("data-edit-kind");
    const pageElement = element.closest<HTMLElement>("[data-page-index]");
    const pageIndex = Number(pageElement?.getAttribute("data-page-index"));
    if (!field || !isEditableRegionKind(kind) || !Number.isInteger(pageIndex)) return;
    activateRegion(pageIndex, field, kind);
  }, [activateRegion]);

  const handleCanvasPointerActivate = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const region = (event.target as HTMLElement).closest<HTMLElement>(EDITABLE_REGION_SELECTOR);
    if (!region) return;
    event.preventDefault();
    activateRegionFromElement(region);
  }, [activateRegionFromElement]);

  const handleCanvasRegionKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.hasAttribute("data-edit-field")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateRegionFromElement(target);
    } else if (event.key === "Escape") {
      event.preventDefault();
      target.closest<HTMLElement>("[data-page-index]")?.focus();
    }
  }, [activateRegionFromElement]);

  const moveSelection = useCallback((direction: -1 | 1) => {
    navigateToIndex(effectiveSelectedIndex + direction);
  }, [effectiveSelectedIndex, navigateToIndex]);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;

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
        // Skip while an inline text/image edit is open: activating one on a
        // large region (e.g. a full-bleed cover image) can require enough
        // scroll to bring the click point into view that this observer's
        // "closest to viewport center" page flips before the edit even
        // renders, which would unmount it out from under the user (both
        // overlays are gated on `selectedPage.id`).
        if (Number.isInteger(index) && saveState !== "dirty" && saveState !== "error" && !activeInlineEdit && !activeImageEdit) {
          setSelectedIndex(index);
        }
      },
      { root: viewport, rootMargin: "-42% 0px -42% 0px" }
    );

    pageRefs.current.forEach((page) => {
      if (page) observer.observe(page);
    });
    return () => observer.disconnect();
  }, [activeImageEdit, activeInlineEdit, pageMeta.length, saveState]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const measured = pageRefs.current.flatMap((page, index) => {
        const section = page?.querySelector<HTMLElement>("[data-page-content]")?.firstElementChild;
        if (!(section instanceof HTMLElement)) return [];
        const pageBounds = section.getBoundingClientRect();
        const overflows = Array.from(section.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, table")).some((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.bottom > pageBounds.bottom + 1 || bounds.right > pageBounds.right + 1 || bounds.top < pageBounds.top - 1 || bounds.left < pageBounds.left - 1;
        });
        return overflows ? [index] : [];
      });
      setOverflowPageIndexes(measured);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [pageMeta.length, pages]);

  // Keyboard reach for editable regions is scoped to the selected page only,
  // so Tab cycles that page's fields instead of the whole scrolled document.
  useEffect(() => {
    const container = canvasViewportRef.current;
    if (!container) return;
    const selectedPageElement = pageRefs.current[effectiveSelectedIndex];
    const fields = editorPages[selectedPage.id]?.fields ?? [];

    container.querySelectorAll<HTMLElement>(EDITABLE_REGION_SELECTOR).forEach((region) => {
      const withinSelectedPage = Boolean(selectedPageElement?.contains(region));
      if (!withinSelectedPage) {
        region.removeAttribute("tabindex");
        region.removeAttribute("role");
        region.removeAttribute("aria-label");
        return;
      }
      const field = region.getAttribute("data-edit-field");
      const kind = region.getAttribute("data-edit-kind");
      const label = fields.find((candidate) => candidate.name === field)?.label ?? field ?? "field";
      region.setAttribute("tabindex", "0");
      region.setAttribute("role", "button");
      region.setAttribute("aria-label", kind === "image" ? `Edit ${label} image` : `Edit ${label}`);
    });
  }, [editorPages, effectiveSelectedIndex, pages, selectedPage.id]);

  // Mirrors inspector focus onto the matching canvas region. Cleanup walks
  // the tracked elements directly rather than re-querying, since continuous
  // mode keeps every page mounted and a stale highlight can sit on a page the
  // user has since scrolled away from.
  useEffect(() => {
    highlightedElementsRef.current.forEach((element) => element.classList.remove(EDITABLE_REGION_ACTIVE_CLASS));
    highlightedElementsRef.current = [];
    if (!highlightedField) return;
    const selectedPageElement = pageRefs.current[effectiveSelectedIndex];
    if (!selectedPageElement) return;
    const matches = Array.from(
      selectedPageElement.querySelectorAll<HTMLElement>(`[data-edit-field="${highlightedField}"]`)
    );
    matches.forEach((element) => element.classList.add(EDITABLE_REGION_ACTIVE_CLASS));
    highlightedElementsRef.current = matches;
  }, [effectiveSelectedIndex, highlightedField, pages]);

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
    const dialog = pagesOpen
      ? pagesDialogRef.current
      : propertiesOpen
        ? propertiesDialogRef.current
        : reviewOpen
          ? reviewDialogRef.current
          : activityOpen
            ? activityDialogRef.current
            : catalogOpen
              ? catalogDialogRef.current
              : compositionOpen
                ? compositionDialogRef.current
                : null;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
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
        if (reviewOpen) setReviewOpen(false);
        if (activityOpen) setActivityOpen(false);
        if (catalogOpen) setCatalogOpen(false);
        if (compositionOpen) setCompositionOpen(false);
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
  }, [activityOpen, catalogOpen, closeProperties, compositionOpen, pagesOpen, propertiesOpen, reviewOpen]);

  return (
    <main data-theme={theme} suppressHydrationWarning className="proposal-studio flex h-dvh min-h-0 flex-col overflow-hidden bg-editor-shell text-editor-text-strong">
      <div aria-live="polite" className="sr-only">{regionAnnouncement}</div>
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
          <EditorButton
            type="button"
            onClick={() => {
              setPagesOpen(false);
              setPropertiesOpen(false);
              setReviewOpen(true);
            }}
            aria-label="Review proposal readiness"
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            <span className="hidden xl:inline">Review</span>
          </EditorButton>
          <EditorButton
            type="button"
            onClick={() => {
              setPagesOpen(false);
              setPropertiesOpen(false);
              setReviewOpen(false);
              setActivityOpen(true);
            }}
            aria-label="Open activity and comments"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            <span className="hidden xl:inline">Activity</span>
          </EditorButton>
          <EditorButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
          </EditorButton>
          <SaveAsTemplateButton proposalId={proposal.id} />
          <SendProposalButton proposalId={proposal.id} disabled={saveState === "dirty" || saveState === "saving" || saveState === "error"} />
          <ShareProposalButton
            proposalId={proposal.id}
            disabled={saveState === "dirty" || saveState === "saving" || saveState === "error"}
          />
          <PdfGenerateButton
            proposalId={proposal.id}
            disabled={saveState === "dirty" || saveState === "saving" || saveState === "error"}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[252px_minmax(0,1fr)_304px] 2xl:grid-cols-[252px_minmax(0,1fr)_304px_380px]">
        <aside className="hidden min-h-0 border-r border-editor-border-subtle lg:block">
          <PageNavigator
            proposalId={proposal.id}
            composition={composition}
            pageMeta={pageMeta}
            pages={pages}
            selectedPage={selectedPage}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={selectPage}
            pageSize={pageSize}
            enableDrag
            announce={setRegionAnnouncement}
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
                onClick={() => {
                  setPagesOpen(false);
                  setPropertiesOpen(false);
                  setReviewOpen(false);
                  setCatalogOpen(true);
                }}
                aria-label="Open contextual catalog"
                title="Catalog"
                className="rounded-lg 2xl:hidden"
              >
                <LibraryBig className="size-5" aria-hidden="true" />
              </EditorButton>
              <EditorButton
                type="button"
                size="icon"
                onClick={() => {
                  setPagesOpen(false);
                  setPropertiesOpen(false);
                  setReviewOpen(false);
                  setCatalogOpen(false);
                  setCompositionOpen(true);
                }}
                aria-label="Open document structure"
                title="Document structure"
                className="rounded-lg"
              >
                <ListTree className="size-5" aria-hidden="true" />
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
              <EditorButton
                type="button"
                size="icon"
                onClick={fitCanvas}
                aria-label="Fit pages to available width"
                title="Fit width"
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

          <div
            ref={canvasViewportRef}
            className="min-h-0 flex-1 overflow-auto"
            onClick={handleCanvasPointerActivate}
            onKeyDown={handleCanvasRegionKeyDown}
          >
            <div className="flex min-h-full min-w-full flex-col items-center gap-4 p-4 sm:gap-7 sm:p-8">
              {pages.map((page, index) => {
                const runIndex = runIndexByPageId.get(pageMeta[index].id);
                const isRunStart = runIndex != null;
                return (
                  <Fragment key={pageMeta[index].id}>
                    {isRunStart ? (
                      <InsertionGap
                        proposalId={proposal.id}
                        afterSectionId={runIndex === 0 ? null : sectionRuns[runIndex - 1].sectionId}
                        positionLabel={runIndex === 0 ? "at the start" : `after ${sectionRuns[runIndex - 1].title}`}
                        designContext={designContext}
                        announce={setRegionAnnouncement}
                        highlighted={draggingItem != null && hoveredAfterSectionId === (runIndex === 0 ? null : sectionRuns[runIndex - 1].sectionId)}
                      />
                    ) : null}
                    <div
                      ref={(element) => { pageRefs.current[index] = element; }}
                      data-page-index={index}
                      tabIndex={-1}
                      aria-label={`Page ${index + 1}: ${pageMeta[index].title}`}
                      className={`relative shrink-0 bg-white shadow-editor-page ring-1 outline-none transition-shadow ${
                        effectiveSelectedIndex === index ? "ring-editor-border-strong ring-offset-2 ring-offset-editor-canvas" : "ring-black/5"
                      }`}
                      style={{ width: pageSize.widthPx * zoom, height: pageSize.heightPx * zoom }}
                    >
                      <div
                        data-page-content
                        className="absolute left-0 top-0 origin-top-left bg-white"
                        style={{ width: pageSize.widthPx, height: pageSize.heightPx, transform: `scale(${zoom})` }}
                      >
                        {page}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {sectionRuns.length > 0 ? (
                <InsertionGap
                  proposalId={proposal.id}
                  afterSectionId={sectionRuns[sectionRuns.length - 1].sectionId}
                  positionLabel={`after ${sectionRuns[sectionRuns.length - 1].title}`}
                  designContext={designContext}
                  announce={setRegionAnnouncement}
                  highlighted={draggingItem != null && hoveredAfterSectionId === sectionRuns[sectionRuns.length - 1].sectionId}
                />
              ) : null}
            </div>
          </div>

          {draggingItem && ghostPosition ? createPortal(
            <div
              data-catalog-drag-ghost=""
              className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-lg border border-editor-border-strong bg-editor-panel px-3 py-2 text-xs font-semibold text-editor-text shadow-2xl"
              style={{ left: ghostPosition.x + 14, top: ghostPosition.y + 14 }}
            >
              {draggingItem.kind === "hotel" ? <Building2 className="size-3.5 text-editor-brand" aria-hidden="true" /> : draggingItem.kind === "excursion" ? <Compass className="size-3.5 text-editor-brand" aria-hidden="true" /> : <FileText className="size-3.5 text-editor-brand" aria-hidden="true" />}
              {draggingItem.label}
            </div>,
            document.body
          ) : null}

          {inlineEdit ? (
            <InlineRegionEditor
              key={`${inlineEdit.pageId}-${inlineEdit.field}`}
              pageRefs={pageRefs}
              pageIndex={inlineEdit.pageIndex}
              field={inlineEdit.field}
              draft={pageFieldDraft}
              onClose={closeInlineEdit}
              snippets={library.snippets}
            />
          ) : null}

          {imageEdit ? (
            <ImageRegionPopover
              key={`${imageEdit.pageId}-${imageEdit.field}`}
              pageRefs={pageRefs}
              pageIndex={imageEdit.pageIndex}
              field={imageEdit.field}
              label={imageEdit.label}
              draft={pageFieldDraft}
              onClose={closeImageEdit}
              images={library.images}
            />
          ) : null}
        </section>

        <aside className="hidden min-h-0 border-l border-editor-border-subtle xl:block">
          <PropertiesPanel
            instanceId="desktop"
            selectedPage={selectedPage}
            pageCount={pageMeta.length}
            proposalId={proposal.id}
            editorConfig={editorConfig}
            designContext={designContext}
            designChanging={designChanging}
            designError={designError}
            onDesignChange={(designKey) => void changeDocumentDesign(designKey)}
            activeVariantId={activeVariantId}
            onVariantChange={(variantId) => void changeSectionVariant(variantId)}
            onSaveStateChange={setSaveState}
            mode={inspectorMode}
            onModeChange={setInspectorMode}
            draft={pageFieldDraft}
            focusField={focusField}
            onFieldFocus={setHighlightedField}
            onEscapeToCanvas={() => focusCanvasPage(selectedPage.id)}
            library={library}
          />
        </aside>

        <aside className="hidden min-h-0 border-l border-editor-border-subtle 2xl:block">
          <CatalogPanel
            proposalId={proposal.id}
            catalog={catalog}
            library={library}
            designContext={designContext}
            enableDrag
            onDragStart={startDrag}
          />
        </aside>
      </div>

      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-editor-border-subtle bg-editor-panel-muted px-4 text-xs text-editor-text-muted">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
              aria-label="Zoom out"
              className={`grid size-11 place-items-center rounded-full text-editor-text-muted hover:bg-editor-inset hover:text-editor-text ${editorFocusRing}`}
            >
              <Minus className="size-2.5" aria-hidden="true" />
            </button>
            <input
              type="range"
              min={Math.round(MIN_ZOOM * 100)}
              max={Math.round(MAX_ZOOM * 100)}
              step={Math.round(ZOOM_STEP * 100)}
              value={Math.round(zoom * 100)}
              onChange={(event) => setZoom(clampZoom(Number(event.target.value) / 100))}
              aria-label="Zoom level"
              className="h-1 w-24 accent-editor-brand"
            />
            <button
              type="button"
              onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
              aria-label="Zoom in"
              className={`grid size-11 place-items-center rounded-full text-editor-text-muted hover:bg-editor-inset hover:text-editor-text ${editorFocusRing}`}
            >
              <Plus className="size-2.5" aria-hidden="true" />
            </button>
            <span className="w-9 text-right tabular-nums text-editor-text" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <span className="hidden size-1 rounded-full bg-editor-border sm:block" aria-hidden="true" />
          <div className="hidden items-center gap-3 sm:flex">
            <span>{pageMeta.length} pages</span>
            <span className="size-1 rounded-full bg-editor-border" aria-hidden="true" />
            <span>{proposal.travelDates}</span>
            <span className="size-1 rounded-full bg-editor-border" aria-hidden="true" />
            <span>{designContext.active.name} · {pageSize.formatLabel}</span>
          </div>
        </div>
        {saveState !== "loaded" ? (
          <EditorStatusBadge
            tone={SAVE_TONE[saveState]}
            icon={saveState === "error" ? <CircleAlert className="size-3.5" /> : <Check className="size-3.5" />}
          >
            {SAVE_COPY[saveState]}
          </EditorStatusBadge>
        ) : null}
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
            proposalId={proposal.id}
            composition={composition}
            pageMeta={pageMeta}
            pages={pages}
            selectedPage={selectedPage}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={selectPage}
            pageSize={pageSize}
            onClose={() => setPagesOpen(false)}
            announce={setRegionAnnouncement}
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
            designContext={designContext}
            designChanging={designChanging}
            designError={designError}
            onDesignChange={(designKey) => void changeDocumentDesign(designKey)}
            activeVariantId={activeVariantId}
            onVariantChange={(variantId) => void changeSectionVariant(variantId)}
            onSaveStateChange={setSaveState}
            onClose={closeProperties}
            mode={inspectorMode}
            onModeChange={setInspectorMode}
            draft={pageFieldDraft}
            focusField={focusField}
            onFieldFocus={setHighlightedField}
            onEscapeToCanvas={() => focusCanvasPage(selectedPage.id)}
            library={library}
          />
        </EditorDrawer>
      ) : null}

      {reviewOpen ? (
        <EditorDrawer
          ref={reviewDialogRef}
          side="right"
          label="Proposal review"
          onClose={() => setReviewOpen(false)}
          panelClassName="w-[min(92vw,400px)]"
        >
          <ReviewPanel
            pageMeta={pageMeta}
            overflowPageIndexes={overflowPageIndexes}
            designContext={designContext}
            saveState={saveState}
            designError={designError}
            variableIssues={variableIssues}
            openThreadCount={activity.threads.filter((thread) => thread.status === "open" && !thread.orphaned).length}
            onClose={() => setReviewOpen(false)}
          />
        </EditorDrawer>
      ) : null}

      {activityOpen ? (
        <EditorDrawer
          ref={activityDialogRef}
          side="right"
          label="Proposal activity"
          onClose={() => setActivityOpen(false)}
          panelClassName="w-[min(92vw,420px)]"
        >
          <ActivityPanel proposalId={proposal.id} pageMeta={pageMeta} activity={activity} onClose={() => setActivityOpen(false)} />
        </EditorDrawer>
      ) : null}

      {catalogOpen ? (
        <EditorDrawer
          ref={catalogDialogRef}
          side="left"
          label="Contextual catalog"
          onClose={() => setCatalogOpen(false)}
          panelClassName="w-[min(96vw,440px)]"
        >
          <CatalogPanel proposalId={proposal.id} catalog={catalog} library={library} designContext={designContext} onClose={() => setCatalogOpen(false)} />
        </EditorDrawer>
      ) : null}

      {compositionOpen ? (
        <EditorDrawer
          ref={compositionDialogRef}
          side="left"
          label="Document structure"
          onClose={() => setCompositionOpen(false)}
          panelClassName="w-[min(96vw,420px)]"
        >
          <CompositionPanel
            proposalId={proposal.id}
            composition={composition}
            designContext={designContext}
            onClose={() => setCompositionOpen(false)}
          />
        </EditorDrawer>
      ) : null}
    </main>
  );
}
