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

export function isEditableRegionKind(value: string | null): value is EditableRegionKind {
  return value === "text" || value === "multiline" || value === "image";
}
