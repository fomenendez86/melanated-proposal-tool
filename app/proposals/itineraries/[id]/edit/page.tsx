import { notFound } from "next/navigation";

import ItineraryEditorShell from "@/components/dashboard/ItineraryEditorShell";
import { listClientOptions } from "@/lib/db/getClientOptions";
import { getItineraryCatalogPickerData } from "@/lib/db/getItineraryCatalogPickerData";
import { getItineraryData } from "@/lib/db/getItineraryData";
import { listSelectableDocumentDesigns } from "@/lib/designs/registry";

export default async function ItineraryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itineraryId = Number(id);
  if (!Number.isInteger(itineraryId)) notFound();

  const [itinerary, catalog, clients] = await Promise.all([
    getItineraryData(itineraryId),
    getItineraryCatalogPickerData(),
    listClientOptions(),
  ]);
  if (!itinerary) notFound();

  const designs = listSelectableDocumentDesigns();

  return <ItineraryEditorShell itinerary={itinerary} catalog={catalog} clients={clients} designs={designs} />;
}
