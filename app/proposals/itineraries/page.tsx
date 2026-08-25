import ItineraryGallery from "@/components/dashboard/ItineraryGallery";
import { getItineraryList } from "@/lib/db/getItineraryList";

export default async function ItinerariesPage() {
  const itineraries = await getItineraryList();

  return <ItineraryGallery itineraries={itineraries} />;
}
