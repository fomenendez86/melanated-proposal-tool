import type { ProposalEditorFieldName } from "./proposalEditorTypes";

/**
 * Canvas editable-region contract (Phase 10.1).
 *
 * Design renderers annotate the DOM elements that display an editable value
 * with these data attributes. The editor shell discovers regions through event
 * delegation on the rendered page container and maps them back to the same
 * field schema that drives the Properties inspector — it never imports block
 * renderers or branches on section types. Aggregated collections (itinerary,
 * excursions, terms, weather, important items, list columns, payment schedule)
 * annotate their rendered container with the single aggregated field name.
 *
 * The attributes are inert metadata: preview, share, and PDF output carry them
 * without visual or behavioral effect.
 */

export type EditableRegionKind = "text" | "multiline" | "image";

export interface EditableRegionAttributes {
  "data-edit-field": ProposalEditorFieldName;
  "data-edit-kind": EditableRegionKind;
}

export function editableRegion(
  field: ProposalEditorFieldName,
  kind: EditableRegionKind = "text"
): EditableRegionAttributes {
  return { "data-edit-field": field, "data-edit-kind": kind };
}

export const EDITABLE_REGION_SELECTOR = "[data-edit-field]";

/** Class toggled on the canvas region that currently mirrors inspector focus. */
export const EDITABLE_REGION_ACTIVE_CLASS = "proposal-studio-region-active";

/**
 * Class toggled on the source region while its inline overlay (Phase 10.3) is
 * open. It hides the region's own glyphs (`color: transparent`, see
 * app/globals.css) without changing its box, so the overlay's copy of the
 * text is the only visible layer and the page's protected geometry never
 * shifts.
 */
export const EDITABLE_REGION_EDITING_CLASS = "proposal-studio-region-editing";

/**
 * Fields excluded from the inline canvas overlay (Phase 10.3) even though
 * they are plain text/multiline regions on an auto-save page. `coverTitle`
 * renders in `[writing-mode:vertical-rl]` as a deliberate brand flourish;
 * editable vertical-writing-mode inputs are unreliable across browsers, so
 * this field stays on the Phase 10.2 flow (click focuses the inspector
 * field, which edits it as normal horizontal text).
 */
const INLINE_EDIT_EXCLUDED_FIELDS = new Set<ProposalEditorFieldName>(["coverTitle"]);

/**
 * Whether `field`/`kind` on a page with `saveMode` is eligible for the inline
 * canvas overlay. Only plain auto-saved text/multiline fields qualify:
 * - `image` regions are out of scope until Phase 10.4.
 * - `saveMode: "explicit"` pages (Pricing, Hotel, itinerary, excursions,
 *   weather, terms, important items, inclusions/exclusions) are deliberately
 *   review-then-save flows; autosaving them inline would contradict that
 *   design. They keep the Phase 10.2 jump-to-inspector flow.
 */
export function isInlineEditableRegion(
  field: ProposalEditorFieldName,
  kind: EditableRegionKind,
  saveMode: "auto" | "explicit" | undefined
): boolean {
  if (kind === "image") return false;
  if (saveMode === "explicit") return false;
  return !INLINE_EDIT_EXCLUDED_FIELDS.has(field);
}

export function isEditableRegionKind(value: string | null): value is EditableRegionKind {
  return value === "text" || value === "multiline" || value === "image";
}

/**
 * Shared id for the inspector control that edits `field` on `pageId`, so the
 * canvas click bridge and the form that renders the control agree on one id
 * without either side hardcoding the other's naming scheme.
 */
export function fieldElementId(instanceId: string, pageId: string, field: ProposalEditorFieldName) {
  return `editor-${instanceId}-${pageId}-${field}`;
}
