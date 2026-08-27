"use client";

import {
  ArrowDown,
  ArrowUp,
  Bus,
  MapPinArea,
  Airplane,
  Plus,
  Trash,
  Ticket,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createProposal } from "@/app/proposals/actions";
import {
  addItineraryExcursion,
  addItineraryFlight,
  addItineraryHotel,
  addItineraryTier,
  addItineraryTransport,
  deleteItineraryTier,
  moveItineraryExcursion,
  moveItineraryFlight,
  moveItineraryHotel,
  moveItineraryTransport,
  removeItineraryExcursion,
  removeItineraryFlight,
  removeItineraryHotel,
  removeItineraryTransport,
  updateItineraryDays,
} from "@/app/proposals/itineraries/[id]/actions";
import AppShell from "@/components/admin/AdminShell";
import { archiveItinerary, restoreItinerary } from "@/app/proposals/itineraries/actions";
import ItineraryEditor from "@/components/editor/ItineraryEditor";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminSegmentedControl from "@/components/admin/ui/AdminSegmentedControl";
import { AdminEmptyState, AdminNotice, adminFocusRing } from "@/components/admin/ui/AdminUi";
import { serializeItineraryEditorDays } from "@/lib/editor/itineraryEditorCodec";
import type { EditorSaveState } from "@/lib/editor/proposalEditorTypes";
import type { ItineraryData } from "@/lib/db/getItineraryData";
import type { ItineraryCatalogPickerData } from "@/lib/db/getItineraryCatalogPickerData";
import type { ClientOption } from "@/lib/db/getClientOptions";
import type { DocumentDesignDescriptor } from "@/lib/designs/types";

const inputClass = `h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm ${adminFocusRing}`;

const SAVE_COPY: Record<EditorSaveState, string> = {
  loaded: "Loaded",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Could not save",
};

function MoveButtons({ disabled, onUp, onDown, atTop, atBottom }: { disabled: boolean; onUp: () => void; onDown: () => void; atTop: boolean; atBottom: boolean }) {
  return (
    <>
      <AdminButton type="button" variant="ghost" size="icon" aria-label="Move up" disabled={disabled || atTop} onClick={onUp}>
        <ArrowUp className="size-3.5" aria-hidden="true" />
      </AdminButton>
      <AdminButton type="button" variant="ghost" size="icon" aria-label="Move down" disabled={disabled || atBottom} onClick={onDown}>
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </AdminButton>
    </>
  );
}

function GenerateProposalDialog({
  itinerary,
  clients,
  designs,
  onClose,
}: {
  itinerary: ItineraryData;
  clients: ClientOption[];
  designs: DocumentDesignDescriptor[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [clientMode, setClientMode] = useState<"existing" | "new">(clients.length > 0 ? "existing" : "new");
  const [existingClientId, setExistingClientId] = useState(clients[0]?.id ?? 0);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [tripName, setTripName] = useState(itinerary.name);
  const [designChoice, setDesignChoice] = useState(designs[0] ? `${designs[0].id}:${designs[0].version}` : "");
  const [tierId, setTierId] = useState<number | null>(itinerary.tiers[0]?.id ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    const [designId, versionText] = designChoice.split(":");
    const designVersion = Number(versionText);
    if (!designId || !Number.isInteger(designVersion)) {
      setError("Choose a document design.");
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
      origin: { type: "itinerary", itineraryId: itinerary.id, tierId },
    });
    setLoading(false);
    if (!result.ok || !result.id) {
      setError(result.formError ?? "The proposal could not be created.");
      return;
    }
    router.push(`/proposals/${result.id}/editor`);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-gray-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="generate-proposal-title">
      <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white p-5 shadow-2xl">
        <h2 id="generate-proposal-title" className="text-lg font-semibold text-gray-800">Generate proposal</h2>
        <p className="mt-1 text-sm text-gray-500">Creates a real proposal from this itinerary that you can personalize, download, or send.</p>

        <div className="mt-5 space-y-4">
          <div>
            <span className="text-xs font-semibold text-gray-700">Client</span>
            <div className="mt-1.5">
              <AdminSegmentedControl label="Client source" value={clientMode} onChange={setClientMode} options={[{ value: "existing", label: "Existing" }, { value: "new", label: "New" }]} />
            </div>
            {clientMode === "existing" ? (
              <select aria-label="Existing client" className={`mt-2 ${inputClass}`} value={existingClientId} onChange={(event) => setExistingClientId(Number(event.target.value))}>
                {clients.length === 0 ? <option value={0}>No clients yet</option> : null}
                {clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}
              </select>
            ) : (
              <div className="mt-2 space-y-2">
                <input aria-label="New client name" placeholder="Client full name" className={inputClass} value={newClientName} onChange={(event) => setNewClientName(event.target.value)} />
                <input aria-label="New client email (optional)" placeholder="Email (optional)" className={inputClass} value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} />
              </div>
            )}
          </div>

          <label className="block text-xs font-semibold text-gray-700">
            Trip name
            <input aria-label="Trip name" className={`mt-1.5 ${inputClass}`} value={tripName} onChange={(event) => setTripName(event.target.value)} />
          </label>

          <label className="block text-xs font-semibold text-gray-700">
            Document design
            <select aria-label="Document design" className={`mt-1.5 ${inputClass}`} value={designChoice} onChange={(event) => setDesignChoice(event.target.value)}>
              {designs.map((design) => (
                <option key={`${design.id}:${design.version}`} value={`${design.id}:${design.version}`}>
                  {design.name}{design.status === "preview" ? " (preview)" : ""}
                </option>
              ))}
            </select>
          </label>

          {itinerary.tiers.length > 0 ? (
            <label className="block text-xs font-semibold text-gray-700">
              Tier
              <select aria-label="Tier" className={`mt-1.5 ${inputClass}`} value={tierId ?? ""} onChange={(event) => setTierId(Number(event.target.value))}>
                {itinerary.tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
              </select>
            </label>
          ) : null}

          {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
          <div className="flex gap-2">
            <AdminButton type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</AdminButton>
            <AdminButton type="button" variant="primary" className="flex-1" disabled={loading} onClick={() => void submit()}>
              {loading ? "Generating…" : "Generate proposal"}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function HotelsPanel({ itinerary, catalog, activeTierId, onChange }: { itinerary: ItineraryData; catalog: ItineraryCatalogPickerData; activeTierId: number | null; onChange: () => void }) {
  const [hotelId, setHotelId] = useState(catalog.hotels[0]?.id ?? 0);
  const [roomCategory, setRoomCategory] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [nights, setNights] = useState(1);
  const [scope, setScope] = useState<"shared" | "tier">(activeTierId ? "tier" : "shared");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const visible = itinerary.hotels.filter((row) => row.tierId === null || row.tierId === activeTierId);

  async function add() {
    setError("");
    if (!hotelId || !roomCategory.trim() || !mealPlan.trim() || nights < 1) {
      setError("Choose a hotel, room category, meal plan, and nights.");
      return;
    }
    setPending(true);
    const result = await addItineraryHotel(itinerary.id, scope === "tier" ? activeTierId : null, { hotelId, roomCategory, mealPlan, nights });
    setPending(false);
    if (!result.ok) {
      setError(result.formError ?? "The hotel could not be added.");
      return;
    }
    setRoomCategory("");
    setMealPlan("");
    setNights(1);
    onChange();
  }

  async function remove(rowId: number) {
    setPending(true);
    await removeItineraryHotel(itinerary.id, rowId);
    setPending(false);
    onChange();
  }

  async function move(rowId: number, direction: -1 | 1) {
    setPending(true);
    await moveItineraryHotel(itinerary.id, activeTierId, rowId, direction);
    setPending(false);
    onChange();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Hotels</h3>
      {visible.length === 0 ? (
        <p className="text-xs text-gray-500">No hotels yet for this scope — the client won&apos;t see an accommodations section unless you add one.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row, index) => {
            const hotel = catalog.hotels.find((h) => h.id === row.hotelId);
            return (
              <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">{hotel?.name ?? `Hotel #${row.hotelId}`}</p>
                  <p className="truncate text-xs text-gray-500">{row.roomCategory} · {row.mealPlan} · {row.nights} night{row.nights === 1 ? "" : "s"} · {row.tierId === null ? "Shared" : "This tier"}</p>
                </div>
                <div className="flex items-center">
                  <MoveButtons disabled={pending} atTop={index === 0} atBottom={index === visible.length - 1} onUp={() => void move(row.id, -1)} onDown={() => void move(row.id, 1)} />
                  <AdminButton type="button" variant="ghost" size="icon" aria-label="Remove hotel" disabled={pending} onClick={() => void remove(row.id)}>
                    <Trash className="size-4" aria-hidden="true" />
                  </AdminButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <select aria-label="Hotel" className={inputClass} value={hotelId} onChange={(event) => setHotelId(Number(event.target.value))}>
          {catalog.hotels.length === 0 ? <option value={0}>No hotels in catalog</option> : null}
          {catalog.hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} — {hotel.cityName}</option>)}
        </select>
        {activeTierId ? (
          <AdminSegmentedControl label="Applies to" value={scope} onChange={setScope} options={[{ value: "shared", label: "All tiers" }, { value: "tier", label: "This tier only" }]} />
        ) : null}
        <input className={inputClass} placeholder="Room category" value={roomCategory} onChange={(event) => setRoomCategory(event.target.value)} />
        <input className={inputClass} placeholder="Meal plan" value={mealPlan} onChange={(event) => setMealPlan(event.target.value)} />
        <input type="number" min={1} className={inputClass} placeholder="Nights" value={nights} onChange={(event) => setNights(Number(event.target.value))} />
      </div>
      {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
      <AdminButton type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void add()}>
        <Plus className="size-3.5" aria-hidden="true" /> Add hotel
      </AdminButton>
    </section>
  );
}

function FlightsPanel({ itinerary, activeTierId, onChange }: { itinerary: ItineraryData; activeTierId: number | null; onChange: () => void }) {
  const [carrier, setCarrier] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [originAirport, setOriginAirport] = useState("");
  const [destinationAirport, setDestinationAirport] = useState("");
  const [scope, setScope] = useState<"shared" | "tier">(activeTierId ? "tier" : "shared");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const visible = itinerary.flights.filter((row) => row.tierId === null || row.tierId === activeTierId);

  async function add() {
    setError("");
    if (!carrier.trim() && !flightNumber.trim() && !originAirport.trim()) {
      setError("Enter at least a carrier, flight number, or route.");
      return;
    }
    setPending(true);
    const result = await addItineraryFlight(itinerary.id, scope === "tier" ? activeTierId : null, { carrier, flightNumber, originAirport, destinationAirport });
    setPending(false);
    if (!result.ok) {
      setError(result.formError ?? "The flight could not be added.");
      return;
    }
    setCarrier("");
    setFlightNumber("");
    setOriginAirport("");
    setDestinationAirport("");
    onChange();
  }

  async function remove(rowId: number) {
    setPending(true);
    await removeItineraryFlight(itinerary.id, rowId);
    setPending(false);
    onChange();
  }

  async function move(rowId: number, direction: -1 | 1) {
    setPending(true);
    await moveItineraryFlight(itinerary.id, activeTierId, rowId, direction);
    setPending(false);
    onChange();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-800">
        <Airplane className="size-4" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Flights</h3>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-gray-500">No flights yet — optional, leave empty if the client books their own.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row, index) => (
            <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{[row.carrier, row.flightNumber].filter(Boolean).join(" ") || "Flight"}</p>
                <p className="truncate text-xs text-gray-500">{[row.originAirport, row.destinationAirport].filter(Boolean).join(" → ")} · {row.tierId === null ? "Shared" : "This tier"}</p>
              </div>
              <div className="flex items-center">
                <MoveButtons disabled={pending} atTop={index === 0} atBottom={index === visible.length - 1} onUp={() => void move(row.id, -1)} onDown={() => void move(row.id, 1)} />
                <AdminButton type="button" variant="ghost" size="icon" aria-label="Remove flight" disabled={pending} onClick={() => void remove(row.id)}>
                  <Trash className="size-4" aria-hidden="true" />
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputClass} placeholder="Carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
        <input className={inputClass} placeholder="Flight number" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} />
        <input className={inputClass} placeholder="Origin airport" value={originAirport} onChange={(event) => setOriginAirport(event.target.value)} />
        <input className={inputClass} placeholder="Destination airport" value={destinationAirport} onChange={(event) => setDestinationAirport(event.target.value)} />
        {activeTierId ? (
          <AdminSegmentedControl label="Applies to" value={scope} onChange={setScope} options={[{ value: "shared", label: "All tiers" }, { value: "tier", label: "This tier only" }]} className="sm:col-span-2" />
        ) : null}
      </div>
      {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
      <AdminButton type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void add()}>
        <Plus className="size-3.5" aria-hidden="true" /> Add flight
      </AdminButton>
    </section>
  );
}

function TransportPanel({ itinerary, activeTierId, onChange }: { itinerary: ItineraryData; activeTierId: number | null; onChange: () => void }) {
  const [mode, setMode] = useState("");
  const [description, setDescription] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [scope, setScope] = useState<"shared" | "tier">(activeTierId ? "tier" : "shared");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const visible = itinerary.transport.filter((row) => row.tierId === null || row.tierId === activeTierId);

  async function add() {
    setError("");
    if (!mode.trim() && !description.trim()) {
      setError("Enter at least a mode or description.");
      return;
    }
    setPending(true);
    const result = await addItineraryTransport(itinerary.id, scope === "tier" ? activeTierId : null, { mode, description, pickupLocation, dropoffLocation });
    setPending(false);
    if (!result.ok) {
      setError(result.formError ?? "The transportation entry could not be added.");
      return;
    }
    setMode("");
    setDescription("");
    setPickupLocation("");
    setDropoffLocation("");
    onChange();
  }

  async function remove(rowId: number) {
    setPending(true);
    await removeItineraryTransport(itinerary.id, rowId);
    setPending(false);
    onChange();
  }

  async function move(rowId: number, direction: -1 | 1) {
    setPending(true);
    await moveItineraryTransport(itinerary.id, activeTierId, rowId, direction);
    setPending(false);
    onChange();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-800">
        <Bus className="size-4" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Ground transportation</h3>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-gray-500">No transportation legs yet — optional.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row, index) => (
            <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{row.mode || row.description || "Transportation"}</p>
                <p className="truncate text-xs text-gray-500">{[row.pickupLocation, row.dropoffLocation].filter(Boolean).join(" → ")} · {row.tierId === null ? "Shared" : "This tier"}</p>
              </div>
              <div className="flex items-center">
                <MoveButtons disabled={pending} atTop={index === 0} atBottom={index === visible.length - 1} onUp={() => void move(row.id, -1)} onDown={() => void move(row.id, 1)} />
                <AdminButton type="button" variant="ghost" size="icon" aria-label="Remove transportation" disabled={pending} onClick={() => void remove(row.id)}>
                  <Trash className="size-4" aria-hidden="true" />
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputClass} placeholder="Mode (private transfer, shuttle…)" value={mode} onChange={(event) => setMode(event.target.value)} />
        <input className={inputClass} placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <input className={inputClass} placeholder="Pickup" value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} />
        <input className={inputClass} placeholder="Drop-off" value={dropoffLocation} onChange={(event) => setDropoffLocation(event.target.value)} />
        {activeTierId ? (
          <AdminSegmentedControl label="Applies to" value={scope} onChange={setScope} options={[{ value: "shared", label: "All tiers" }, { value: "tier", label: "This tier only" }]} className="sm:col-span-2" />
        ) : null}
      </div>
      {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
      <AdminButton type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void add()}>
        <Plus className="size-3.5" aria-hidden="true" /> Add transportation
      </AdminButton>
    </section>
  );
}

function ExcursionsPanel({ itinerary, catalog, activeTierId, onChange }: { itinerary: ItineraryData; catalog: ItineraryCatalogPickerData; activeTierId: number | null; onChange: () => void }) {
  const [excursionId, setExcursionId] = useState(catalog.excursions[0]?.id ?? 0);
  const [priceOverride, setPriceOverride] = useState("");
  const [scope, setScope] = useState<"shared" | "tier">(activeTierId ? "tier" : "shared");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const visible = itinerary.excursions.filter((row) => row.tierId === null || row.tierId === activeTierId);

  async function add() {
    setError("");
    if (!excursionId) {
      setError("Choose an excursion.");
      return;
    }
    setPending(true);
    const result = await addItineraryExcursion(itinerary.id, scope === "tier" ? activeTierId : null, {
      excursionId,
      priceOverride: priceOverride.trim() ? Number(priceOverride) : undefined,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.formError ?? "The excursion could not be added.");
      return;
    }
    setPriceOverride("");
    onChange();
  }

  async function remove(rowId: number) {
    setPending(true);
    await removeItineraryExcursion(itinerary.id, rowId);
    setPending(false);
    onChange();
  }

  async function move(rowId: number, direction: -1 | 1) {
    setPending(true);
    await moveItineraryExcursion(itinerary.id, activeTierId, rowId, direction);
    setPending(false);
    onChange();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-800">
        <Ticket className="size-4" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Excursions</h3>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-gray-500">No excursions yet — optional.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row, index) => {
            const excursion = catalog.excursions.find((e) => e.id === row.excursionId);
            return (
              <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">{excursion?.title ?? `Excursion #${row.excursionId}`}</p>
                  <p className="truncate text-xs text-gray-500">
                    {row.priceOverride != null ? `$${row.priceOverride}` : "Catalog price"} · {row.tierId === null ? "Shared" : "This tier"}
                  </p>
                </div>
                <div className="flex items-center">
                  <MoveButtons disabled={pending} atTop={index === 0} atBottom={index === visible.length - 1} onUp={() => void move(row.id, -1)} onDown={() => void move(row.id, 1)} />
                  <AdminButton type="button" variant="ghost" size="icon" aria-label="Remove excursion" disabled={pending} onClick={() => void remove(row.id)}>
                    <Trash className="size-4" aria-hidden="true" />
                  </AdminButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <select aria-label="Excursion" className={inputClass} value={excursionId} onChange={(event) => setExcursionId(Number(event.target.value))}>
          {catalog.excursions.length === 0 ? <option value={0}>No excursions in catalog</option> : null}
          {catalog.excursions.map((excursion) => <option key={excursion.id} value={excursion.id}>{excursion.title} — {excursion.cityName}</option>)}
        </select>
        <input type="number" min={0} step="0.01" className={inputClass} placeholder="Price override (optional)" value={priceOverride} onChange={(event) => setPriceOverride(event.target.value)} />
        {activeTierId ? (
          <AdminSegmentedControl label="Applies to" value={scope} onChange={setScope} options={[{ value: "shared", label: "All tiers" }, { value: "tier", label: "This tier only" }]} className="sm:col-span-2" />
        ) : null}
      </div>
      {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}
      <AdminButton type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void add()}>
        <Plus className="size-3.5" aria-hidden="true" /> Add excursion
      </AdminButton>
    </section>
  );
}

export default function ItineraryEditorShell({
  itinerary,
  catalog,
  clients,
  designs,
}: {
  itinerary: ItineraryData;
  catalog: ItineraryCatalogPickerData;
  clients: ClientOption[];
  designs: DocumentDesignDescriptor[];
}) {
  const router = useRouter();
  const [activeTierId, setActiveTierId] = useState<number | null>(itinerary.tiers[0]?.id ?? null);
  const [saveState, setSaveState] = useState<EditorSaveState>("loaded");
  const [newTierName, setNewTierName] = useState("");
  const [addingTier, setAddingTier] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    router.refresh();
  }

  async function addTier() {
    setError("");
    const name = newTierName.trim();
    if (!name) {
      setError("Enter a tier name.");
      return;
    }
    setAddingTier(true);
    const result = await addItineraryTier(itinerary.id, { name });
    setAddingTier(false);
    if (!result.ok) {
      setError(result.formError ?? "The tier could not be created.");
      return;
    }
    setNewTierName("");
    if (result.id) setActiveTierId(result.id);
    refresh();
  }

  async function removeTier(tierId: number) {
    if (!window.confirm("Delete this tier? Hotels/flights/transport specific to it will also be removed.")) return;
    const result = await deleteItineraryTier(itinerary.id, tierId);
    if (!result.ok) {
      setError(result.formError ?? "The tier could not be deleted.");
      return;
    }
    setActiveTierId(itinerary.tiers.find((t) => t.id !== tierId)?.id ?? null);
    refresh();
  }

  async function archiveOrRestore(archive: boolean) {
    const result = archive ? await archiveItinerary(itinerary.id) : await restoreItinerary(itinerary.id);
    if (!result.ok) {
      setError(result.formError ?? "That action could not be completed.");
      return;
    }
    refresh();
  }

  return (
    <AppShell
      active="itineraries"
      title={itinerary.name}
      subtitle={SAVE_COPY[saveState]}
      backHref="/proposals/itineraries"
      headerActions={(
        <>
          {itinerary.archived ? (
            <AdminButton type="button" variant="secondary" onClick={() => void archiveOrRestore(false)}>Restore</AdminButton>
          ) : (
            <AdminButton type="button" variant="secondary" onClick={() => void archiveOrRestore(true)}>Archive</AdminButton>
          )}
          <AdminButton type="button" variant="primary" onClick={() => setGenerating(true)}>
            Generate proposal
          </AdminButton>
        </>
      )}
    >
      <div className="app-page max-w-5xl">

      {error ? <AdminNotice tone="danger" className="px-3 py-2 text-xs">{error}</AdminNotice> : null}

      <section className="space-y-2">
        <span className="text-xs font-semibold text-gray-700">Tiers</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <AdminButton type="button" variant={activeTierId === null ? "primary" : "secondary"} size="sm" onClick={() => setActiveTierId(null)}>
            {itinerary.tiers.length === 0 ? "All content" : "Shared (all tiers)"}
          </AdminButton>
          {itinerary.tiers.map((tier) => (
            <div key={tier.id} className="flex items-center">
              <AdminButton type="button" variant={activeTierId === tier.id ? "primary" : "secondary"} size="sm" onClick={() => setActiveTierId(tier.id)}>
                {tier.name}
              </AdminButton>
              <AdminButton type="button" variant="ghost" size="icon" aria-label={`Delete ${tier.name} tier`} onClick={() => void removeTier(tier.id)}>
                <Trash className="size-3.5" aria-hidden="true" />
              </AdminButton>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input className={`${inputClass} max-w-xs`} placeholder="New tier name (e.g. Premium)" value={newTierName} onChange={(event) => setNewTierName(event.target.value)} />
          <AdminButton type="button" variant="secondary" size="sm" disabled={addingTier} onClick={() => void addTier()}>
            <Plus className="size-3.5" aria-hidden="true" /> Add tier
          </AdminButton>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <ItineraryEditor
          initialText={serializeItineraryEditorDays(
            itinerary.days.map((day) => ({
              dayNumber: day.dayNumber,
              date: day.date ?? "",
              subtitle: day.subtitle ?? "",
              highlightLine: day.highlightLine ?? "",
              activities: day.activities.map((a) => ({ timeRange: a.timeRange ?? "", description: a.description })),
              paragraphs: day.paragraphs.map((p) => p.body),
              images: day.images.map((i) => i.url),
            }))
          )}
          onSave={(serialized) => updateItineraryDays(itinerary.id, serialized)}
          onSaveStateChange={setSaveState}
        />
      </section>

      <HotelsPanel itinerary={itinerary} catalog={catalog} activeTierId={activeTierId} onChange={refresh} />
      <ExcursionsPanel itinerary={itinerary} catalog={catalog} activeTierId={activeTierId} onChange={refresh} />
      <FlightsPanel itinerary={itinerary} activeTierId={activeTierId} onChange={refresh} />
      <TransportPanel itinerary={itinerary} activeTierId={activeTierId} onChange={refresh} />

      {itinerary.days.length === 0 && itinerary.hotels.length === 0 ? (
        <AdminEmptyState icon={<MapPinArea className="size-5" aria-hidden="true" />} title="Start with a day" description='Use "Add day" above to build the day-by-day plan.' />
      ) : null}

      {generating ? <GenerateProposalDialog itinerary={itinerary} clients={clients} designs={designs} onClose={() => setGenerating(false)} /> : null}
      </div>
    </AppShell>
  );
}
