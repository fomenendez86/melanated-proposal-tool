"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Copy,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  itineraryMayOverflow,
  parseItineraryEditorText,
  serializeItineraryEditorDays,
  validateItineraryEditorDays,
} from "@/lib/editor/itineraryEditorCodec";
import type { ItineraryDraftActivity, ItineraryDraftDay } from "@/lib/editor/itineraryEditorCodec";
import type { EditorSaveState } from "@/lib/editor/proposalEditorTypes";

export interface ItineraryEditorSaveResult {
  ok: boolean;
  fieldErrors?: { itinerarySnapshotText?: string };
  formError?: string;
}

import {
  EditorButton,
  EditorNotice,
  EditorSegmentedControl,
  editorFocusRing,
} from "./EditorUi";

interface UiActivity extends ItineraryDraftActivity {
  key: string;
}

interface UiDay extends Omit<ItineraryDraftDay, "activities"> {
  key: string;
  activities: UiActivity[];
}

let keySequence = 0;
function nextKey(prefix: string) {
  keySequence += 1;
  return `${prefix}-${keySequence}`;
}

function withUiKeys(days: ItineraryDraftDay[]): UiDay[] {
  return days.map((day) => ({
    ...day,
    key: nextKey("day"),
    activities: day.activities.map((activity) => ({ ...activity, key: nextKey("activity") })),
  }));
}

function withoutUiKeys(days: UiDay[]): ItineraryDraftDay[] {
  return days.map((day, index) => ({
    dayNumber: index + 1,
    date: day.date,
    subtitle: day.subtitle,
    highlightLine: day.highlightLine,
    activities: day.activities.map(({ timeRange, description }) => ({ timeRange, description })),
    paragraphs: day.paragraphs,
    images: day.images,
  }));
}

function emptyDay(): UiDay {
  return {
    key: nextKey("day"),
    dayNumber: 1,
    date: "",
    subtitle: "",
    highlightLine: "",
    activities: [{ key: nextKey("activity"), timeRange: "", description: "" }],
    paragraphs: [""],
    images: [],
  };
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const inputClass = `w-full rounded-lg border border-editor-border bg-editor-raised px-3 py-2.5 text-sm text-editor-text-strong outline-none transition placeholder:text-editor-text-subtle focus:border-editor-border-strong focus:ring-2 focus:ring-editor-border-strong/20 ${editorFocusRing}`;

export default function ItineraryEditor({
  initialText,
  onSave,
  onSaveStateChange,
  focusRequestId,
}: {
  /** The persisted itinerary text (the line-oriented day/activity DSL). */
  initialText: string;
  /** Persists the serialized draft. Proposal context calls updateProposalFields
   *  under the hood; a library-level itinerary context calls updateItineraryDays. */
  onSave: (serializedText: string) => Promise<ItineraryEditorSaveResult>;
  onSaveStateChange: (state: EditorSaveState) => void;
  /** Bumped when a canvas click activates this collection; scrolls it into view. */
  focusRequestId?: number;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusRequestId === undefined) return;
    const element = rootRef.current;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    element?.focus({ preventScroll: true });
  }, [focusRequestId]);

  const initialDays = useMemo(() => parseItineraryEditorText(initialText) ?? [], [initialText]);
  const [days, setDays] = useState<UiDay[]>(() => withUiKeys(initialDays));
  const [savedText, setSavedText] = useState(() => serializeItineraryEditorDays(initialDays));
  const [mode, setMode] = useState<"expanded" | "condensed">("expanded");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const draftDays = withoutUiKeys(days);
  const serialized = serializeItineraryEditorDays(draftDays);
  const isDirty = serialized !== savedText;
  const validationErrors = validateItineraryEditorDays(draftDays);
  const overflowDays = draftDays
    .map((day, index) => itineraryMayOverflow(day) ? index + 1 : null)
    .filter((day): day is number => day !== null);

  function updateDays(updater: (current: UiDay[]) => UiDay[]) {
    setDays(updater);
    setFormError("");
    onSaveStateChange("dirty");
  }

  function updateDay(dayIndex: number, updater: (day: UiDay) => UiDay) {
    updateDays((current) => current.map((day, index) => index === dayIndex ? updater(day) : day));
  }

  async function save() {
    if (!isDirty || saving) return;
    if (validationErrors.length > 0) {
      setFormError(validationErrors[0]);
      onSaveStateChange("error");
      return;
    }

    setSaving(true);
    setFormError("");
    onSaveStateChange("saving");
    const result = await onSave(serialized);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.fieldErrors?.itinerarySnapshotText ?? result.formError ?? "The itinerary could not be saved.");
      onSaveStateChange("error");
      return;
    }

    setSavedText(serialized);
    onSaveStateChange("saved");
    router.refresh();
  }

  return (
    <div className="space-y-4 outline-none" ref={rootRef} tabIndex={-1}>
      <div>
        <div className="flex items-center gap-2 text-editor-brand">
          <CalendarDays className="size-4" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Travel itinerary</h3>
        </div>
        <p className="mt-1 text-xs leading-4 text-editor-text-muted">
          Changes update both the overview and day-by-day proposal pages after you save.
        </p>
      </div>

      <EditorSegmentedControl
        label="Itinerary editing density"
        value={mode}
        options={[
          { value: "expanded", label: "Expanded" },
          { value: "condensed", label: "Condensed" },
        ]}
        onChange={setMode}
        className="flex w-full [&>button]:flex-1"
      />

      {overflowDays.length > 0 ? (
        <EditorNotice tone="warning" title="Pagination check recommended" className="px-3 py-2.5 text-xs">
          Day{overflowDays.length === 1 ? "" : "s"} {overflowDays.join(", ")} may contain more content than the protected page layout can comfortably fit.
        </EditorNotice>
      ) : null}

      <div className="space-y-3">
        {days.map((day, dayIndex) => (
          <section key={day.key} className="overflow-hidden rounded-xl border border-editor-border-subtle bg-editor-raised">
            <div className="flex items-center gap-2 border-b border-editor-border-subtle bg-editor-inset px-3 py-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-editor-brand text-xs font-bold text-white">
                {dayIndex + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-editor-text">
                  {day.subtitle.trim() || `Day ${dayIndex + 1}`}
                </h4>
                <p className="truncate text-[11px] text-editor-text-muted">
                  {day.date.trim() || "Date not set"} · {day.activities.length} activit{day.activities.length === 1 ? "y" : "ies"}
                </p>
              </div>
              <div className="flex items-center">
                <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={dayIndex === 0} onClick={() => updateDays((current) => moveItem(current, dayIndex, dayIndex - 1))} aria-label={`Move day ${dayIndex + 1} up`}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </EditorButton>
                <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={dayIndex === days.length - 1} onClick={() => updateDays((current) => moveItem(current, dayIndex, dayIndex + 1))} aria-label={`Move day ${dayIndex + 1} down`}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </EditorButton>
              </div>
            </div>

            {mode === "expanded" ? (
              <div className="space-y-5 p-3.5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="text-xs font-semibold text-editor-text">
                    Date
                    <input className={`${inputClass} mt-1.5`} value={day.date} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, date: event.target.value }))} placeholder="August 18, 2026" />
                  </label>
                  <label className="text-xs font-semibold text-editor-text">
                    Subtitle
                    <input className={`${inputClass} mt-1.5`} value={day.subtitle} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, subtitle: event.target.value }))} placeholder="Arrival in Arusha" />
                  </label>
                </div>
                <label className="block text-xs font-semibold text-editor-text">
                  Highlight
                  <input className={`${inputClass} mt-1.5`} value={day.highlightLine} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, highlightLine: event.target.value }))} placeholder="Private airport transfer and welcome dinner" />
                </label>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-[0.1em] text-editor-text-muted">Activities</h5>
                    <EditorButton type="button" variant="ghost" size="sm" className="h-9" onClick={() => updateDay(dayIndex, (current) => ({ ...current, activities: [...current.activities, { key: nextKey("activity"), timeRange: "", description: "" }] }))}>
                      <Plus className="size-3.5" aria-hidden="true" /> Add
                    </EditorButton>
                  </div>
                  <div className="mt-2 space-y-2">
                    {day.activities.map((activity, activityIndex) => (
                      <div key={activity.key} className="rounded-lg border border-editor-border-subtle p-2.5">
                        <div className="grid gap-2 sm:grid-cols-[96px_1fr] xl:grid-cols-1">
                          <input aria-label={`Day ${dayIndex + 1} activity ${activityIndex + 1} time`} className={inputClass} value={activity.timeRange} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, activities: current.activities.map((item, index) => index === activityIndex ? { ...item, timeRange: event.target.value } : item) }))} placeholder="9:00 AM" />
                          <textarea aria-label={`Day ${dayIndex + 1} activity ${activityIndex + 1} description`} rows={2} className={inputClass} value={activity.description} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, activities: current.activities.map((item, index) => index === activityIndex ? { ...item, description: event.target.value } : item) }))} placeholder="Describe the activity" />
                        </div>
                        <div className="mt-1 flex justify-end">
                          <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={activityIndex === 0} onClick={() => updateDay(dayIndex, (current) => ({ ...current, activities: moveItem(current.activities, activityIndex, activityIndex - 1) }))} aria-label="Move activity up"><ArrowUp className="size-3.5" /></EditorButton>
                          <EditorButton type="button" variant="ghost" size="icon" className="size-9" disabled={activityIndex === day.activities.length - 1} onClick={() => updateDay(dayIndex, (current) => ({ ...current, activities: moveItem(current.activities, activityIndex, activityIndex + 1) }))} aria-label="Move activity down"><ArrowDown className="size-3.5" /></EditorButton>
                          <EditorButton type="button" variant="ghost" size="icon" className="size-9 text-editor-danger" onClick={() => updateDay(dayIndex, (current) => ({ ...current, activities: current.activities.filter((_, index) => index !== activityIndex) }))} aria-label="Delete activity"><Trash2 className="size-3.5" /></EditorButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-[0.1em] text-editor-text-muted">Narrative</h5>
                    <EditorButton type="button" variant="ghost" size="sm" className="h-9" onClick={() => updateDay(dayIndex, (current) => ({ ...current, paragraphs: [...current.paragraphs, ""] }))}><Plus className="size-3.5" /> Add</EditorButton>
                  </div>
                  <div className="mt-2 space-y-2">
                    {day.paragraphs.map((paragraph, paragraphIndex) => (
                      <div key={`${day.key}-paragraph-${paragraphIndex}`} className="flex items-start gap-1.5">
                        <textarea aria-label={`Day ${dayIndex + 1} paragraph ${paragraphIndex + 1}`} rows={3} className={inputClass} value={paragraph} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, paragraphs: current.paragraphs.map((item, index) => index === paragraphIndex ? event.target.value : item) }))} placeholder="Describe this part of the day" />
                        <EditorButton type="button" variant="ghost" size="icon" className="text-editor-danger" onClick={() => updateDay(dayIndex, (current) => ({ ...current, paragraphs: current.paragraphs.filter((_, index) => index !== paragraphIndex) }))} aria-label="Delete paragraph"><Trash2 className="size-4" /></EditorButton>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-editor-text-muted"><ImageIcon className="size-3.5" /> Images</h5>
                    <EditorButton type="button" variant="ghost" size="sm" className="h-9" onClick={() => updateDay(dayIndex, (current) => ({ ...current, images: [...current.images, ""] }))}><Plus className="size-3.5" /> Add</EditorButton>
                  </div>
                  <div className="mt-2 space-y-2">
                    {day.images.map((url, imageIndex) => (
                      <div key={`${day.key}-image-${imageIndex}`} className="flex items-center gap-1.5">
                        <input aria-label={`Day ${dayIndex + 1} image ${imageIndex + 1}`} className={inputClass} value={url} onChange={(event) => updateDay(dayIndex, (current) => ({ ...current, images: current.images.map((item, index) => index === imageIndex ? event.target.value : item) }))} placeholder="/proposal-assets/day-image.jpg" />
                        <EditorButton type="button" variant="ghost" size="icon" disabled={imageIndex === 0} onClick={() => updateDay(dayIndex, (current) => ({ ...current, images: moveItem(current.images, imageIndex, imageIndex - 1) }))} aria-label="Move image up"><ArrowUp className="size-4" /></EditorButton>
                        <EditorButton type="button" variant="ghost" size="icon" disabled={imageIndex === day.images.length - 1} onClick={() => updateDay(dayIndex, (current) => ({ ...current, images: moveItem(current.images, imageIndex, imageIndex + 1) }))} aria-label="Move image down"><ArrowDown className="size-4" /></EditorButton>
                        <EditorButton type="button" variant="ghost" size="icon" className="text-editor-danger" onClick={() => updateDay(dayIndex, (current) => ({ ...current, images: current.images.filter((_, index) => index !== imageIndex) }))} aria-label="Delete image"><Trash2 className="size-4" /></EditorButton>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-1 border-t border-editor-border-subtle px-3 py-2">
              <EditorButton type="button" variant="ghost" size="sm" onClick={() => updateDays((current) => {
                const copy: UiDay = { ...day, key: nextKey("day"), activities: day.activities.map((activity) => ({ ...activity, key: nextKey("activity") })), paragraphs: [...day.paragraphs], images: [...day.images] };
                const next = [...current];
                next.splice(dayIndex + 1, 0, copy);
                return next;
              })}><Copy className="size-3.5" /> Duplicate</EditorButton>
              <EditorButton type="button" variant="ghost" size="sm" className="text-editor-danger" onClick={() => {
                if (window.confirm(`Delete day ${dayIndex + 1}? This can be cancelled by reloading before you save.`)) {
                  updateDays((current) => current.filter((_, index) => index !== dayIndex));
                }
              }}><Trash2 className="size-3.5" /> Delete</EditorButton>
            </div>
          </section>
        ))}
      </div>

      <EditorButton type="button" variant="secondary" className="w-full border-dashed" onClick={() => updateDays((current) => [...current, emptyDay()])}>
        <Plus className="size-4" aria-hidden="true" /> Add day
      </EditorButton>

      {formError ? <EditorNotice tone="danger" className="px-3 py-2.5 text-xs">{formError}</EditorNotice> : null}

      <EditorButton type="button" variant="primary" disabled={!isDirty || saving} className="w-full" onClick={() => void save()}>
        {saving ? "Saving itinerary…" : isDirty ? `Save ${days.length}-day itinerary` : "Itinerary saved"}
      </EditorButton>
    </div>
  );
}
