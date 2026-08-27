"use client";

import {
  Archive,
  ArrowUUpLeft,
  Copy,
  MapPinArea,
  PencilLine,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  archiveItinerary,
  createItinerary,
  deleteItinerary,
  duplicateItinerary,
  restoreItinerary,
  updateItineraryFields,
} from "@/app/proposals/itineraries/actions";
import AppShell from "@/components/admin/AdminShell";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminEmptyState, AdminNotice, AdminStatusBadge, adminFocusRing } from "@/components/admin/ui/AdminUi";
import type { ItineraryListRow } from "@/lib/db/getItineraryList";

const inputClass = `h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm ${adminFocusRing}`;

function useFocusTrapDialog(onClose: () => void) {
  const triggerWasFocused = useRef(document.activeElement as HTMLElement | null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerWasFocused.current;
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    focusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
  }, [onClose]);

  return dialogRef;
}

function CreateItineraryDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useFocusTrapDialog(onClose);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter an itinerary name.");
      return;
    }
    setSaving(true);
    const result = await createItinerary({ name: trimmed, description: description || undefined, destinationLabel: destinationLabel || undefined });
    setSaving(false);
    if (!result.ok || !result.id) {
      setError(result.formError ?? "The itinerary could not be created.");
      return;
    }
    router.push(`/proposals/itineraries/${result.id}/edit`);
  }

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[70] grid place-items-center bg-gray-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-itinerary-title">
      <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-500">
            <MapPinArea className="size-4" aria-hidden="true" />
            <h2 id="create-itinerary-title" className="text-lg font-semibold">New itinerary</h2>
          </div>
          <AdminButton type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close new itinerary dialog">
            <X className="size-5" aria-hidden="true" />
          </AdminButton>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-gray-700">
            Name
            <input aria-label="Itinerary name" className={`mt-1.5 ${inputClass}`} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="Classic Kenya & Tanzania" autoFocus />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Destination
            <input aria-label="Destination" className={`mt-1.5 ${inputClass}`} value={destinationLabel} onChange={(event) => setDestinationLabel(event.target.value)} maxLength={120} placeholder="Kenya & Tanzania" />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Description
            <textarea aria-label="Itinerary description" className={`mt-1.5 ${inputClass} h-20 resize-none py-2`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} />
          </label>
          {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
          <AdminButton type="button" variant="primary" className="w-full" disabled={saving} onClick={() => void submit()}>
            {saving ? "Creating…" : "Create itinerary"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

function ManageItineraryDialog({ itinerary, onClose }: { itinerary: ItineraryListRow; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useFocusTrapDialog(onClose);
  const [name, setName] = useState(itinerary.name);
  const [description, setDescription] = useState(itinerary.description ?? "");
  const [destinationLabel, setDestinationLabel] = useState(itinerary.destinationLabel ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter an itinerary name.");
      return;
    }
    setSaving(true);
    const result = await updateItineraryFields(itinerary.id, { name: trimmed, description: description || undefined, destinationLabel: destinationLabel || undefined });
    setSaving(false);
    if (!result.ok) {
      setError(result.formError ?? "The itinerary could not be updated.");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[70] grid place-items-center bg-gray-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="manage-itinerary-title">
      <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-500">
            <PencilLine className="size-4" aria-hidden="true" />
            <h2 id="manage-itinerary-title" className="text-lg font-semibold">Manage itinerary</h2>
          </div>
          <AdminButton type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close manage itinerary dialog">
            <X className="size-5" aria-hidden="true" />
          </AdminButton>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-gray-700">
            Name
            <input aria-label="Itinerary name" className={`mt-1.5 ${inputClass}`} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Destination
            <input aria-label="Destination" className={`mt-1.5 ${inputClass}`} value={destinationLabel} onChange={(event) => setDestinationLabel(event.target.value)} maxLength={120} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Description
            <textarea aria-label="Itinerary description" className={`mt-1.5 ${inputClass} h-20 resize-none py-2`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} />
          </label>
          {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
          <AdminButton type="button" variant="primary" className="w-full" disabled={saving} onClick={() => void submit()}>
            {saving ? "Saving…" : "Save"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryGallery({ itineraries }: { itineraries: ItineraryListRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [managingId, setManagingId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const managing = itineraries.find((itinerary) => itinerary.id === managingId) ?? null;

  async function runAction(id: number, action: () => Promise<{ ok: boolean; formError?: string }>) {
    setError("");
    setPendingId(id);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(result.formError ?? "That action could not be completed.");
      return;
    }
    router.refresh();
  }

  async function runDuplicate(id: number) {
    setError("");
    setPendingId(id);
    const result = await duplicateItinerary(id);
    setPendingId(null);
    if (!result.ok) {
      setError(result.formError ?? "The itinerary could not be duplicated.");
      return;
    }
    router.refresh();
  }

  async function runDelete(itinerary: ItineraryListRow) {
    if (!window.confirm(`Delete "${itinerary.name}"? This cannot be undone.`)) return;
    await runAction(itinerary.id, () => deleteItinerary(itinerary.id));
  }

  return (
    <AppShell
      active="itineraries"
      title="Itineraries"
      subtitle={`${itineraries.length} itinerar${itineraries.length === 1 ? "y" : "ies"} · reusable trip structures`}
      backHref="/proposals"
      headerActions={(
        <AdminButton type="button" variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New itinerary
        </AdminButton>
      )}
    >
      <div className="app-page">

      {error ? <p className="text-sm font-semibold text-error-600">{error}</p> : null}

      {itineraries.length === 0 ? (
        <AdminEmptyState
          icon={<MapPinArea className="size-5" aria-hidden="true" />}
          title="No itineraries yet"
          description="Create an itinerary to build a reusable day-by-day trip skeleton with optional tier variations."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {itineraries.map((itinerary) => (
            <div key={itinerary.id} className="app-card flex flex-col">
              <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-brand-50 text-brand-500">
                {itinerary.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={itinerary.thumbnailUrl} alt="" className="size-full object-cover" />
                ) : (
                  <MapPinArea className="size-8" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">{itinerary.name}</h2>
                  <AdminStatusBadge tone={itinerary.archived ? "neutral" : "success"} className="capitalize">
                    {itinerary.archived ? "archived" : "active"}
                  </AdminStatusBadge>
                </div>
                {itinerary.description ? <p className="line-clamp-2 text-xs text-gray-500">{itinerary.description}</p> : null}
                <p className="text-xs text-gray-400">
                  {itinerary.dayCount} day{itinerary.dayCount === 1 ? "" : "s"}
                  {itinerary.tierNames.length > 0 ? ` · ${itinerary.tierNames.join(", ")}` : ""}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                  <Link href={`/proposals/itineraries/${itinerary.id}/edit`} prefetch={false}>
                    <AdminButton type="button" variant="secondary" size="sm">
                      <PencilLine className="size-4" aria-hidden="true" />
                      Edit
                    </AdminButton>
                  </Link>
                  <AdminButton type="button" variant="ghost" size="icon" aria-label={`Manage ${itinerary.name}`} onClick={() => setManagingId(itinerary.id)}>
                    <PencilLine className="size-4" aria-hidden="true" />
                  </AdminButton>
                  <AdminButton type="button" variant="ghost" size="icon" aria-label={`Duplicate ${itinerary.name}`} disabled={pendingId === itinerary.id} onClick={() => void runDuplicate(itinerary.id)}>
                    <Copy className="size-4" aria-hidden="true" />
                  </AdminButton>
                  {itinerary.archived ? (
                    <AdminButton type="button" variant="ghost" size="icon" aria-label={`Restore ${itinerary.name}`} disabled={pendingId === itinerary.id} onClick={() => void runAction(itinerary.id, () => restoreItinerary(itinerary.id))}>
                      <ArrowUUpLeft className="size-4" aria-hidden="true" />
                    </AdminButton>
                  ) : (
                    <AdminButton type="button" variant="ghost" size="icon" aria-label={`Archive ${itinerary.name}`} disabled={pendingId === itinerary.id} onClick={() => void runAction(itinerary.id, () => archiveItinerary(itinerary.id))}>
                      <Archive className="size-4" aria-hidden="true" />
                    </AdminButton>
                  )}
                  <AdminButton type="button" variant="ghost" size="icon" className="text-error-600" aria-label={`Delete ${itinerary.name}`} disabled={pendingId === itinerary.id} onClick={() => void runDelete(itinerary)}>
                    <Trash className="size-4" aria-hidden="true" />
                  </AdminButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating ? <CreateItineraryDialog onClose={() => setCreating(false)} /> : null}
      {managing ? <ManageItineraryDialog itinerary={managing} onClose={() => setManagingId(null)} /> : null}
      </div>
    </AppShell>
  );
}
