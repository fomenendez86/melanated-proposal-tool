"use client";

import { Building2, Check, Compass, GripVertical, LibraryBig, MapPin, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  addCatalogExcursionToProposal,
  addCatalogHotelToProposal,
  createCatalogExcursionAndAdd,
  createCatalogHotelAndAdd,
  updateCatalogExcursionDefault,
  updateCatalogHotelDefault,
} from "@/app/proposals/[id]/editor/catalogActions";
import type { ProposalCatalogData } from "@/lib/catalog/types";
import type { ProposalDesignContext, ProposalSectionType } from "@/lib/designs/types";
import type { ContentLibraryData } from "@/lib/library/types";

import ContentLibraryPanel from "./ContentLibraryPanel";
import {
  EditorButton,
  EditorEmptyState,
  EditorNotice,
  EditorPanelHeader,
  EditorSegmentedControl,
  editorFocusRing,
} from "./EditorUi";
import type { CatalogDragItem } from "./useCatalogDragInsert";

type CatalogMode = "hotels" | "excursions" | "library";

const controlClass = `h-11 w-full rounded-lg border border-editor-border bg-editor-raised px-3 text-sm text-editor-text outline-none transition placeholder:text-editor-text-subtle focus:border-editor-border-strong focus:ring-2 focus:ring-editor-border-strong/20 ${editorFocusRing}`;
const textAreaClass = `${controlClass} h-auto py-2.5`;

export default function CatalogPanel({
  proposalId,
  catalog,
  library,
  onClose,
  designContext,
  enableDrag = false,
  onDragStart,
}: {
  proposalId: number;
  catalog: ProposalCatalogData;
  library: ContentLibraryData;
  onClose?: () => void;
  designContext: ProposalDesignContext;
  enableDrag?: boolean;
  onDragStart?: (item: CatalogDragItem, event: React.PointerEvent) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CatalogMode>("hotels");
  const [query, setQuery] = useState("");
  const [countryId, setCountryId] = useState(0);
  const [destinationId, setDestinationId] = useState(0);
  const [cityId, setCityId] = useState(0);
  const [pendingKey, setPendingKey] = useState("");
  const [selectedHotels, setSelectedHotels] = useState(() => new Set(catalog.hotels.filter((item) => item.selected).map((item) => item.id)));
  const [selectedExcursions, setSelectedExcursions] = useState(() => new Set(catalog.excursions.filter((item) => item.selected).map((item) => item.id)));
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newHotel, setNewHotel] = useState({ cityId: 0, name: "", description: "", room: "", meal: "", imageUrl: "" });
  const [newExcursion, setNewExcursion] = useState({ cityId: 0, title: "", description: "", basePrice: "", priceUnit: "per_person" as "per_person" | "per_group" | "per_vehicle", priceNote: "", imageUrl: "" });

  const countries = useMemo(() => {
    const unique = new Map<number, string>();
    catalog.locations.forEach((location) => unique.set(location.countryId, location.countryName));
    return [...unique].map(([id, name]) => ({ id, name }));
  }, [catalog.locations]);
  const destinations = useMemo(() => {
    const unique = new Map<number, string>();
    catalog.locations.filter((location) => !countryId || location.countryId === countryId).forEach((location) => unique.set(location.destinationId, location.destinationName));
    return [...unique].map(([id, name]) => ({ id, name }));
  }, [catalog.locations, countryId]);
  const cities = useMemo(() => catalog.locations.filter((location) =>
    (!countryId || location.countryId === countryId) && (!destinationId || location.destinationId === destinationId)
  ), [catalog.locations, countryId, destinationId]);

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = mode === "hotels" ? catalog.hotels : catalog.excursions;
    return source.filter((item) => {
      const label = "name" in item ? item.name : item.title;
      return (!countryId || item.countryId === countryId)
        && (!destinationId || item.destinationId === destinationId)
        && (!cityId || item.cityId === cityId)
        && (!normalized || `${label} ${item.description} ${item.cityName} ${item.destinationName}`.toLowerCase().includes(normalized));
    });
  }, [catalog.excursions, catalog.hotels, cityId, countryId, destinationId, mode, query]);

  const requiredTypes: ProposalSectionType[] = mode === "hotels" ? ["triangleDivider", "hotel"] : mode === "excursions" ? ["cityToursDivider", "excursionList"] : [];
  const dragEnabledForMode = enableDrag && requiredTypes.every((type) => designContext.active.supportedSectionTypes.includes(type));

  async function addItem(itemId: number) {
    const key = `${mode}-${itemId}`;
    setPendingKey(key);
    setFormError("");
    const result = mode === "hotels"
      ? await addCatalogHotelToProposal(proposalId, itemId)
      : await addCatalogExcursionToProposal(proposalId, itemId);
    setPendingKey("");
    if (!result.ok) {
      setFormError(result.formError ?? "The catalog item could not be added.");
      return;
    }
    if (mode === "hotels") setSelectedHotels((current) => new Set(current).add(itemId));
    else setSelectedExcursions((current) => new Set(current).add(itemId));
    router.refresh();
  }

  async function createItem() {
    setPendingKey("create");
    setFormError("");
    const hotelInput = {
          cityId: newHotel.cityId,
          name: newHotel.name,
          description: newHotel.description,
          defaultRoomCategory: newHotel.room,
          defaultMealPlan: newHotel.meal,
          imageUrl: newHotel.imageUrl,
        };
    const excursionInput = {
          cityId: newExcursion.cityId,
          title: newExcursion.title,
          description: newExcursion.description,
          basePrice: Number(newExcursion.basePrice),
          priceUnit: newExcursion.priceUnit,
          priceNote: newExcursion.priceNote,
          imageUrl: newExcursion.imageUrl,
        };
    const result = editingItemId !== null
      ? mode === "hotels"
        ? await updateCatalogHotelDefault(proposalId, editingItemId, hotelInput)
        : await updateCatalogExcursionDefault(proposalId, editingItemId, excursionInput)
      : mode === "hotels"
        ? await createCatalogHotelAndAdd(proposalId, hotelInput)
        : await createCatalogExcursionAndAdd(proposalId, excursionInput);
    setPendingKey("");
    if (!result.ok) {
      setFormError(result.formError ?? "The catalog item could not be created.");
      return;
    }
    setCreating(false);
    setEditingItemId(null);
    router.refresh();
  }

  function startEditing(item: (typeof catalog.hotels)[number] | (typeof catalog.excursions)[number]) {
    setFormError("");
    setEditingItemId(item.id);
    setCreating(true);
    if ("name" in item) {
      setNewHotel({
        cityId: item.cityId,
        name: item.name,
        description: item.description,
        room: item.defaultRoomCategory,
        meal: item.defaultMealPlan,
        imageUrl: item.previewImageUrl ?? "",
      });
    } else {
      setNewExcursion({
        cityId: item.cityId,
        title: item.title,
        description: item.description,
        basePrice: String(item.basePrice),
        priceUnit: item.priceUnit,
        priceNote: item.priceNote ?? "",
        imageUrl: item.previewImageUrl ?? "",
      });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-editor-panel">
      <EditorPanelHeader icon={<LibraryBig className="size-4" />} label="Catalog" onClose={onClose} closeLabel="Close catalog" />
      <div className="border-b border-editor-border-subtle p-4">
        <EditorSegmentedControl
          label="Catalog content type"
          value={mode}
          options={[{ value: "hotels", label: "Hotels" }, { value: "excursions", label: "Excursions" }, { value: "library", label: "Library" }]}
          onChange={(value) => { setMode(value); setCreating(false); setEditingItemId(null); setFormError(""); }}
          className="flex w-full [&>button]:flex-1"
        />
        {mode !== "library" ? <>
          <label className="mt-3 flex h-11 items-center gap-2 rounded-lg border border-editor-border bg-editor-raised px-3 text-editor-text-muted focus-within:border-editor-border-strong focus-within:ring-2 focus-within:ring-editor-border-strong/20">
            <Search className="size-4" aria-hidden="true" />
            <span className="sr-only">Search catalog</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${mode}`} className="min-w-0 flex-1 bg-transparent text-sm text-editor-text-strong outline-none placeholder:text-editor-text-subtle" />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <select aria-label="Filter by country" value={countryId} onChange={(event) => { setCountryId(Number(event.target.value)); setDestinationId(0); setCityId(0); }} className={`${controlClass} px-2 text-xs`}>
              <option value={0}>All countries</option>
              {countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Filter by destination" value={destinationId} onChange={(event) => { setDestinationId(Number(event.target.value)); setCityId(0); }} className={`${controlClass} px-2 text-xs`}>
              <option value={0}>All regions</option>
              {destinations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Filter by city" value={cityId} onChange={(event) => setCityId(Number(event.target.value))} className={`${controlClass} px-2 text-xs`}>
              <option value={0}>All cities</option>
              {cities.map((item) => <option key={item.cityId} value={item.cityId}>{item.cityName}</option>)}
            </select>
          </div>
        </> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {mode === "library" ? (
          <ContentLibraryPanel
            proposalId={proposalId}
            library={library}
            designContext={designContext}
            enableDrag={enableDrag}
            onDragStart={onDragStart}
          />
        ) : <>
        {formError ? <EditorNotice tone="danger" className="mb-3 px-3 py-2 text-xs">{formError}</EditorNotice> : null}

        {creating ? (
          <div className="mb-4 space-y-3 rounded-xl border border-editor-border-strong bg-editor-inset p-3.5">
            <div>
              <h3 className="text-sm font-semibold text-editor-text">{editingItemId === null ? "New" : "Update"} {mode === "hotels" ? "hotel" : "excursion"}</h3>
              <p className="mt-1 text-xs text-editor-text-muted">{editingItemId === null ? "Create a reusable catalog default and add it to this proposal." : "This updates the reusable catalog default. Proposal-only overrides remain separate."}</p>
            </div>
            {mode === "hotels" ? (
              <>
                <select aria-label="Hotel city" value={newHotel.cityId} onChange={(event) => setNewHotel((current) => ({ ...current, cityId: Number(event.target.value) }))} className={controlClass}><option value={0}>Select city</option>{catalog.locations.map((item) => <option key={item.cityId} value={item.cityId}>{item.cityName} · {item.destinationName}</option>)}</select>
                <input aria-label="Hotel name" value={newHotel.name} onChange={(event) => setNewHotel((current) => ({ ...current, name: event.target.value }))} className={controlClass} placeholder="Hotel name" />
                <textarea aria-label="Hotel description" rows={3} value={newHotel.description} onChange={(event) => setNewHotel((current) => ({ ...current, description: event.target.value }))} className={textAreaClass} placeholder="Description" />
                <div className="grid grid-cols-2 gap-2"><input aria-label="Default room category" value={newHotel.room} onChange={(event) => setNewHotel((current) => ({ ...current, room: event.target.value }))} className={controlClass} placeholder="Room category" /><input aria-label="Default meal plan" value={newHotel.meal} onChange={(event) => setNewHotel((current) => ({ ...current, meal: event.target.value }))} className={controlClass} placeholder="Meal plan" /></div>
                <input aria-label="Hotel image URL" value={newHotel.imageUrl} onChange={(event) => setNewHotel((current) => ({ ...current, imageUrl: event.target.value }))} className={controlClass} placeholder="Image /path or https:// URL" />
              </>
            ) : (
              <>
                <select aria-label="Excursion city" value={newExcursion.cityId} onChange={(event) => setNewExcursion((current) => ({ ...current, cityId: Number(event.target.value) }))} className={controlClass}><option value={0}>Select city</option>{catalog.locations.map((item) => <option key={item.cityId} value={item.cityId}>{item.cityName} · {item.destinationName}</option>)}</select>
                <input aria-label="Excursion title" value={newExcursion.title} onChange={(event) => setNewExcursion((current) => ({ ...current, title: event.target.value }))} className={controlClass} placeholder="Excursion title" />
                <textarea aria-label="Excursion description" rows={3} value={newExcursion.description} onChange={(event) => setNewExcursion((current) => ({ ...current, description: event.target.value }))} className={textAreaClass} placeholder="Description" />
                <div className="grid grid-cols-2 gap-2"><input aria-label="Base price" type="number" min="0" step="0.01" value={newExcursion.basePrice} onChange={(event) => setNewExcursion((current) => ({ ...current, basePrice: event.target.value }))} className={controlClass} placeholder="Base price" /><select aria-label="Price unit" value={newExcursion.priceUnit} onChange={(event) => setNewExcursion((current) => ({ ...current, priceUnit: event.target.value as typeof current.priceUnit }))} className={controlClass}><option value="per_person">Per person</option><option value="per_group">Per group</option><option value="per_vehicle">Per vehicle</option></select></div>
                <input aria-label="Price note" value={newExcursion.priceNote} onChange={(event) => setNewExcursion((current) => ({ ...current, priceNote: event.target.value }))} className={controlClass} placeholder="Optional price note" />
                <input aria-label="Excursion image URL" value={newExcursion.imageUrl} onChange={(event) => setNewExcursion((current) => ({ ...current, imageUrl: event.target.value }))} className={controlClass} placeholder="Image /path or https:// URL" />
              </>
            )}
            <div className="flex justify-end gap-2"><EditorButton type="button" variant="ghost" size="sm" onClick={() => { setCreating(false); setEditingItemId(null); }}>Cancel</EditorButton><EditorButton type="button" variant="primary" size="sm" disabled={pendingKey === "create"} onClick={() => void createItem()}>{pendingKey === "create" ? "Saving…" : editingItemId === null ? "Create and add" : "Update catalog default"}</EditorButton></div>
          </div>
        ) : (
          <EditorButton type="button" variant="secondary" className="mb-4 w-full border-dashed" onClick={() => setCreating(true)}><Plus className="size-4" /> Create missing {mode === "hotels" ? "hotel" : "excursion"}</EditorButton>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const isHotel = "name" in item;
            const label = isHotel ? item.name : item.title;
            const selected = item.selected || (isHotel ? selectedHotels.has(item.id) : selectedExcursions.has(item.id));
            const draggable = dragEnabledForMode && !selected;
            return (
              <article key={`${mode}-${item.id}`} className="overflow-hidden rounded-xl border border-editor-border-subtle bg-editor-raised">
                {item.previewImageUrl ? <div className="h-28 bg-editor-inset bg-cover bg-center" style={{ backgroundImage: `url("${item.previewImageUrl.replaceAll('"', '\\"')}")` }} role="img" aria-label={`${label} preview`} /> : null}
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    {draggable ? (
                      <button
                        type="button"
                        onPointerDown={(event) => onDragStart?.({ kind: isHotel ? "hotel" : "excursion", id: item.id, label }, event)}
                        aria-label={`Drag ${label} to a position in the document`}
                        className={`-ml-1 mt-0.5 grid size-8 shrink-0 cursor-grab place-items-center rounded-md text-editor-text-subtle hover:bg-editor-inset hover:text-editor-text active:cursor-grabbing ${editorFocusRing}`}
                      >
                        <GripVertical className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                    <div className="mt-0.5 text-editor-brand">{isHotel ? <Building2 className="size-4" /> : <Compass className="size-4" />}</div>
                    <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-editor-text">{label}</h3><p className="mt-1 flex items-center gap-1 text-[11px] text-editor-text-muted"><MapPin className="size-3" /> {item.cityName} · {item.destinationName}</p></div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-4 text-editor-text-muted">{item.description}</p>
                  {!isHotel ? <p className="mt-2 text-xs font-semibold text-editor-text">${item.basePrice.toLocaleString()} · {item.priceUnit.replaceAll("_", " ")}</p> : null}
                  <EditorButton type="button" variant={selected ? "secondary" : "primary"} size="sm" className="mt-3 w-full" disabled={selected || pendingKey === `${mode}-${item.id}`} onClick={() => void addItem(item.id)}>{selected ? <><Check className="size-4" /> Added to proposal</> : pendingKey === `${mode}-${item.id}` ? "Adding…" : "Add to proposal"}</EditorButton>
                  <EditorButton type="button" variant="ghost" size="sm" className="mt-1 w-full" onClick={() => startEditing(item)}>Update catalog default</EditorButton>
                  {selected ? <p className="mt-1.5 text-center text-[11px] leading-4 text-editor-text-muted">Use this page&apos;s Properties panel for proposal-only edits.</p> : null}
                </div>
              </article>
            );
          })}
          {items.length === 0 ? <EditorEmptyState compact icon={<Search className="size-5" />} title="No catalog matches" description="Adjust the search or location filters, or create the missing item." /> : null}
        </div>
        </>}
      </div>
    </div>
  );
}
