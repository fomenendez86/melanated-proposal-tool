import { eq } from "drizzle-orm";

import type { ProposalEditorPageMap } from "@/lib/editor/proposalEditorTypes";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

import { db } from "./client";
import { clients, proposals } from "./schema";

export async function getProposalEditorData(
  proposalId: number,
  pageMeta: ProposalPageMeta[]
): Promise<ProposalEditorPageMap> {
  const [row] = await db
    .select({
      coverTitle: proposals.coverTitle,
      coverSubtitle: proposals.coverSubtitle,
      coverImageUrl: proposals.coverImageUrl,
      packageName: proposals.packageName,
      selectedTier: proposals.selectedTier,
      travelDatesLabel: proposals.travelDatesLabel,
      passengerManifestLabel: proposals.passengerManifestLabel,
      specialOccasion: proposals.specialOccasion,
      arrivalAirport: proposals.arrivalAirport,
      departureAirport: proposals.departureAirport,
      packageTotalLabel: proposals.packageTotalLabel,
      clientName: clients.fullName,
    })
    .from(proposals)
    .innerJoin(clients, eq(clients.id, proposals.leadClientId))
    .where(eq(proposals.id, proposalId));

  if (!row) return {};

  const coverPage = pageMeta.find((page) => page.type === "cover");
  const detailsPage = pageMeta.find((page) => page.type === "details");
  const result: ProposalEditorPageMap = {};

  if (coverPage) {
    result[coverPage.id] = {
      pageId: coverPage.id,
      kind: "cover",
      heading: "Cover content",
      description: "Changes save automatically and refresh the rendered proposal.",
      fields: [
        { name: "coverTitle", label: "Cover title", value: row.coverTitle, required: true, maxLength: 80 },
        { name: "coverSubtitle", label: "Subtitle", value: row.coverSubtitle ?? "", maxLength: 160, multiline: true },
        { name: "clientName", label: "Client name", value: row.clientName, required: true, maxLength: 120 },
        {
          name: "coverImageUrl",
          label: "Cover image",
          value: row.coverImageUrl ?? "",
          maxLength: 2048,
          placeholder: "/proposal-assets/cover.jpg",
          helpText: "Use a local /path or an https:// URL.",
        },
      ],
    };
  }

  if (detailsPage) {
    result[detailsPage.id] = {
      pageId: detailsPage.id,
      kind: "details",
      heading: "Trip details",
      description: "These values appear on the proposal details page.",
      fields: [
        { name: "packageName", label: "Package booked", value: row.packageName ?? "", required: true, maxLength: 120 },
        { name: "selectedTier", label: "Selected tier", value: row.selectedTier ?? "", maxLength: 80 },
        { name: "travelDatesLabel", label: "Travel dates", value: row.travelDatesLabel ?? "", maxLength: 120 },
        { name: "passengerManifestLabel", label: "Passenger manifest", value: row.passengerManifestLabel ?? "", maxLength: 160 },
        { name: "specialOccasion", label: "Special occasion", value: row.specialOccasion ?? "", maxLength: 120 },
        { name: "arrivalAirport", label: "Arrival airport", value: row.arrivalAirport ?? "", maxLength: 80 },
        { name: "departureAirport", label: "Departure airport", value: row.departureAirport ?? "", maxLength: 80 },
        { name: "packageTotalLabel", label: "Package total", value: row.packageTotalLabel ?? "", maxLength: 120 },
      ],
    };
  }

  return result;
}
